function _1(md){return(
md`# Producció energètica a Espanya`
)}

function _2(htl){return(
htl.html`(Font de dades: <a href="https://www.miteco.gob.es/es/energia/estrategia-normativa/balances/publicaciones/electricas-anuales.html">Ministerio para la transición ecológica</a> i <a href="https://www.ine.es">INE</a>)`
)}

function _selectMetric(Inputs){return(
Inputs.radio(["Producció Neta", "Producció Neta per població (100K habitants)","Producció Neta per PIB (1G euros)"], {label: "Valors a mostrar", value: "Producció Neta"})
)}

function _selectYear(Inputs,prodEnergiaSelectedProv){return(
Inputs.select(prodEnergiaSelectedProv.map(d => d.YEAR), {sort: true, unique: true, label: "Selecciona una tecnologia"})
)}

function _selectTechnology(Inputs,prodEnergiaSelectedProv){return(
Inputs.select(prodEnergiaSelectedProv.map(d => d.TECNOLOGIA), {sort: true, unique: true, label: "Selecciona una tecnologia"})
)}

function _selectProvincia(Inputs,prodEnergia){return(
Inputs.select(prodEnergia.map(d => d.PROVINCIA), {sort: true, unique: true, label: "Selecciona una provincia"})
)}

function _7(md){return(
md`Visualitza les dades de producció energètica a Espanya seleccionant els valors, la tecnologia, l'any i la província. Aquesta última també es pot seleccionar clicant sobre el mapa.`
)}

function _map(d3,projection,width,height,topojson,es)
{
 
  const path = d3.geoPath(projection);

  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height);

  svg.append("g")
    .selectAll("path")
    .data(topojson.feature(es, es.objects.provinces).features)
    .join("path")
    //.attr("fill", '#ccc')
    .attr("d", path)   
    .attr("id",function(d,i) { return "prov" + d.id })
    .attr("class", "province")
    .style("cursor", "pointer")
    //.style("fill", function(d) {
    //       if (d.id == "02")
    //          {return "red"}
    //       else {return "#ccc"}
    //   })    
    .text(function(d,i) { return d.PROVINCIA})
    .append("svg:title").text("")
      

       
    ;
    
  svg.append("path")
    .datum(topojson.mesh(es, es.objects.provinces, (a, b) => a !== b))
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-opacity", 0.25)
    .attr("d", path);    

  svg.append("path")
    .datum(topojson.mesh(es, es.objects.autonomous_regions, (a, b) => a !== b))
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-width", "3")
    .attr("d", path);
  
  svg
    .append("path")
    .attr("d", projection.getCompositionBorders())
    .attr("fill", "none")
    .attr("stroke", "black");

  return svg.node();
}


function _plots(vl,selectMetric,selectTechnology,selectYear,prodEnergiaSelectedProv,width,selectProvincia)
{
// brushing and linking example from https://observablehq.com/@uwdata/interaction
  const brush = vl.selectInterval().encodings('x').resolve('intersect');
  const weatherPalette = ["#aec7e8", "#e7ba52"]

  const byYear =vl.markBar()
    .title({text: selectMetric + ": "+ selectTechnology,
            subtitle: "durant l'any " + selectYear})
    .data(prodEnergiaSelectedProv
          .filter(d => d.TECNOLOGIA == selectTechnology)
          .filter(d => d.YEAR == selectYear) )
    .encode(vl.y().fieldN('PROVINCIA').sort(vl.fieldQ("PROD").order("descending")).axis({labelFontSize: 7}).title("Província"),
           vl.x().fieldQ('PROD').title(selectMetric),
           vl.color().fieldN('SELECTED').scale({range: weatherPalette}))
    .width((width-200)/4)  
    .height(Math.floor(width / 3))



   // The selection
  const hover = vl.selectSingle("hover")
    .on("mouseover")
    .encodings("x")
    .nearest(true)
    .clear("moouseout")
    .init({ x: 2019 });

  const hoverYear = vl.selectSingle("hoverYear")
    .encodings("x")
    .init({ x: selectYear });
 
  // The line and point marks. Notice how we filter the points on hover
  const lineAndPoint = vl.layer(
    vl.markLine(),
    vl.markPoint()
      .transform(vl.filter(hoverYear))
  ).encode(
    vl.y().fieldQ("PROD"),
    vl.color().fieldN("SELECTED").legend(null),  
    vl.detail().fieldN("PROVINCIA")
  );
    // The line and point marks. Notice how we filter the points on hover
  const layerPlots = vl.layer(
    vl.markLine(),
    vl.markPoint()
      .transform(vl.filter(hoverYear))
  )
    .title({text: selectMetric + ": "+ selectTechnology,
              subtitle: "durant al llarg de tot el període"})
    .data(prodEnergiaSelectedProv
          .filter(d => d.TECNOLOGIA == selectTechnology))
    .encode(vl.x().field('YEAR').type('nominal').title("Any"),
             vl.y().fieldQ('PROD').title(selectMetric),
             vl.detail().fieldN('PROVINCIA').title("Província"),
             vl.color().fieldN('SELECTED').legend(null),
             vl.size().fieldN('SELECTED').legend(null),
             vl.tooltip([vl.fieldN("PROVINCIA"), selectProvincia]),
             vl.opacity().value(0.5).if(hoverYear, vl.value(0.9)),
         )
  .width(3*(width-200)/4)
  .height(Math.floor(width / 3))
  .autosize({type: 'fit-x', contains: 'padding'})
  .config({view: {stroke: null}});
  
  // The rule helps as a proxy for the hover. We draw rules all over the chart
  // so we can easily find the nearest one. We then hide them using opacity 0
  const ruleYear =vl.markRule({ strokeWidth: 0.5, tooltip: true })
    // We pivot the data so we can show all the stock prices at once
    .transform(vl.pivot("PROVINCIA").value("PROD").groupby(["YEAR"]))
    .encode(
      vl.opacity().value(0).if(hoverYear, vl.value(0.5)),
      vl.color().value("darkgray"),
      vl.size().value(4),
      vl.tooltip([ selectProvincia])
    )    
    .select(hoverYear);

    const rule =vl.markRule({ strokeWidth: 0.5, tooltip: true })
    // We pivot the data so we can show all the stock prices at once
    .transform(vl.pivot("PROVINCIA").value("PROD").groupby(["YEAR"]))
    .encode(
      vl.opacity().value(0).if(hover, vl.value(0.9)),
      vl.color().value("darkgray"),
      vl.tooltip([ selectProvincia])
    )    
    .select(hover);

   const lineAndRule = vl
    .layer(layerPlots, ruleYear, rule )
    .encode(vl.x().fieldN("YEAR"))
    .data(prodEnergiaSelectedProv.filter(d => d.TECNOLOGIA == selectTechnology))
    .width(3*(width-200)/4)
  .height(Math.floor(width / 3))
  
  return vl.data(prodEnergiaSelectedProv)  
    .hconcat(byYear, lineAndRule)
    .render();
}


function _10(vl,selectMetric,selectProvincia,selectYear,prodEnergiaSelectedProv,width)
{
  const colors_tec = {
    domain: ['Solar fotovoltaica', 'Nuclear', 'Eolica','Hidraulica','Combustibles','Solar termica','Termica renovable y resto','Energia Mareomotriz. olas'],
    range: ['yellow', 'darkred', 'darkgreen','darkblue','black','orange','violet','blue']
  };
  
return vl.markBar()
  .title({text: selectMetric + "  "+selectProvincia+" per tecnologia ",
            subtitle: "durant l'any " + selectYear})
  .data(prodEnergiaSelectedProv.filter(d => d.TECNOLOGIA != "TOTAL" ).filter(d => d.PROVINCIA == selectProvincia ).filter(d => d.YEAR == selectYear ))
    //.transform(vl.filter({filter: "datum.YEAR > 2013"}))
    .encode(
          vl.y().fieldN('PROVINCIA').title(null),
         vl.x().fieldQ('PROD').axis({ grid: false}).title(selectMetric),
         vl.color().fieldN('TECNOLOGIA').scale(colors_tec).legend({orient: 'bottom'})
          )
  .width(width).render()

}


function _11(md){return(
md`## Notes a la visualització`
)}

function _12(md){return(
md`Aquesta visualització és un treball pràctic realitzat en el marc de l'assignatura de Tipologia de dades del màster de _Ciència de dades_ de la UOC. Abans de mostrar les dades les dades han estat netejades, estandaritzades e integrades per tal d'afegir valor al conjunt inicial de dades sobre la producció d'energia a Espanya (_font: Ministerio para la transición ecológica_). <br> <br>Tot i que inicialment s'ha normalitzat les dades per poblacio i PIB de la província, totes dues transformacions aporten informació redundant i els gràfics només canvien lleugerament. A més, cal afegir que no s'ha pogut obtenir de l'INE les dades del PIB dels dos darrers any, fet que implica que les dades normalitzades amb la població poden resultar de major utilitat.`
)}

function _13(md){return(
md`## Definició de variables `
)}

function _projection(composite,width,height,topojson,es){return(
composite.geoConicConformalSpain()
  .fitSize([width, height], topojson.feature(es, es.objects.provinces))
)}

function _es(){return(
fetch("https://unpkg.com/es-atlas@0.2.0/es/municipalities.json").then(response => response.json())
)}

function _height(){return(
600
)}

function _d3(require){return(
require('d3@5')
)}

function _topojson(require){return(
require('topojson@3')
)}

function _composite(require){return(
require('d3-composite-projections')
)}

function _max(get_max){return(
get_max()
)}

function _min(get_min){return(
get_min()
)}

function _colorScale(getColorScale,selectTechnology){return(
getColorScale(selectTechnology)
)}

function _prodEnergiaSelectedProv(updateData){return(
updateData()
)}

function _24(md){return(
md`## Implementació de funcions`
)}

function _25(md){return(
md`Implementació de les funcions per actualitzar la informació que es visualitza en els diferents gràfics en funció dels criteris seleccionats.`
)}

function _26(md){return(
md`Funcions per determinar el ***color*** de les províncies del mapa d'Espanya en funció dels valors mínims i màxims del valor de producció d'Energia. La producció d'energia es pot mostrar en producció neta o normalitzada per 100.000 habitants o PIB de la província en qüestió.`
)}

function _get_min(d3,prodEnergiaSelectedProv,selectYear,selectTechnology){return(
function get_min() {
  let  min = d3.min(prodEnergiaSelectedProv.filter(d => d.YEAR == selectYear)
       .filter(d => d.TECNOLOGIA == selectTechnology), function (d, i) {
        return d.PROD;
      });
      return min;
}
)}

function _get_max(d3,prodEnergiaSelectedProv,selectYear,selectTechnology){return(
function get_max() {
  let  max = d3.max(prodEnergiaSelectedProv.filter(d => d.YEAR == selectYear)
       .filter(d => d.TECNOLOGIA == selectTechnology), function (d, i) {
        return d.PROD;
      });
      return max;
}
)}

function _getColorScale(d3,min,max){return(
function getColorScale(technology) {
  let  colorScale = d3.scaleLinear()
    .domain([min, max])
    .range(["#f9fbe7", "#827717"]);
  
  if(technology == 'Nuclear') {
    colorScale = d3.scaleLinear()
    .domain([min, max])
    .range(["#7b241c", "#f9ebea"].reverse());
  } else if(technology == 'Hidraulica'){
     colorScale = d3.scaleLinear()
    .domain([min, max])
    .range(["#154360", "#ebf5fb"].reverse());
  } else if(technology == 'Solar fotovoltaica'){
     colorScale = d3.scaleLinear()
    .domain([min, max])
    .range(["#7d6608", "#fef9e7"].reverse());
  } else if(technology == 'Combustibles'){
     colorScale = d3.scaleLinear()
    .domain([min, max])
    .range(["#17202a", "#eaecee"].reverse());
  } else if(technology == 'Eolica'){
     colorScale = d3.scaleLinear()
    .domain([min, max])
    .range(["#e8f8f5", "#0e6251"]);
  } else if(technology == 'Solar termica'){
     colorScale = d3.scaleLinear()
    .domain([min, max])
    .range(["#fef5e7", "#7e5109"]);
  } else if(technology == 'Termica renovable y resto'){
     colorScale = d3.scaleLinear()
    .domain([min, max])
    .range(["#f5eef8", "#512e5f"]);
  }  else if(technology == 'Energia Mareomotriz. olas'){
     colorScale = d3.scaleLinear()
    .domain([min, max])

  } 
  return colorScale;
  
  
}
)}

function _30(md){return(
md`Funció per actualitzar les ***dades a mostrar*** segons els filtres establerts, és a dir, quin tipus de valors de producció d'energia es volen mostrar: producció neta o producció neta normalitzada per població o PIB de la província. `
)}

function _updateData(selectMetric,prodEnergiaSelectedProvNeta,prodEnergiaSelectedProvPob,prodEnergiaSelectedProvPib){return(
function updateData() {
  if(selectMetric == "Producció Neta") {    
    return prodEnergiaSelectedProvNeta
  } 
  
  if(selectMetric == "Producció Neta per població (100K habitants)") {
    return prodEnergiaSelectedProvPob
  } 
  
  if(selectMetric == "Producció Neta per PIB (1G euros)") {
    return prodEnergiaSelectedProvPib
  } 

  return prodEnergiaSelectedProvNeta
}
)}

function _32(md){return(
md`Funció per actualitzar els ***valors del mapa*** segons la tecnologia i l'any seleccionats.`
)}

function _update_year(topojson,es,prodEnergiaSelectedProv,selectYear,selectTechnology){return(
function update_year() {
let arr1 = topojson.feature(es, es.objects.provinces).features
let merged = []
for(let i=0; i<arr1.length; i++) {
  merged.push({
   ...arr1[i], 
   ...(prodEnergiaSelectedProv.filter(d => d.YEAR == selectYear)
       .filter(d => d.TECNOLOGIA == selectTechnology)
       .find((itmInner) => itmInner.CODIGO === arr1[i].id))}
  );
}
  return merged
}
)}

function _34(md){return(
md`Funció per ***actualitzar el mapa*** segons els criteris de selecció. Modifica el color amb el que és mostra la província que està correlacionat amb el valor de producció d'energia. A més, implementa la funcionalitat per seleccionar una província en fer un clic sobre aquesta en el mapa.`
)}

function _update_map(d3,colorScale,Event){return(
function update_map(data) {
  var tooltip = d3.select("body")
    .append("div")
    .attr("class","tooltip")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden")
    .style("background", "white")
    .style('fill', 'white')
    .text("a simple tooltip");

  
  d3.select("svg").
    selectAll(".province")
    .data(data)
    .join('.province')
    .style("cursor", "pointer")
    .style('fill', function (d, i) {
        let uRate = d.PROD;
        return uRate ? colorScale(uRate) : "#ccc";
    })
    //.on("click", clicked_alert)
    
    //.text(function(d,i) { return d.PROVINCIA})
    
    //.on("mouseover", function(d){tooltip.text(d.PROVINCIA); return tooltip.style("visibility", "visible");})
    //.on("mousemove", function(){return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
    //.on("mouseout", function(){return tooltip.style("visibility", "hidden");})
    .on('click', function(d, i) {
      //console.log("clicking on", d.PROVINCIA);
      //console.log("clicking on", tooltip);
      //console.log("input on", d3.select("#oi-3a86ea-2"));
      var opts = d3.select("#oi-3a86ea-2").property("options")
      // loop through the options, check the values
      for ( var i = 0; i < opts.length; i++ ) {
          // assuming 2 would be states[ state ] or whatevs          
          if ( opts[i].innerText == d.PROVINCIA ) {
            // set to this index
            d3.select("#oi-3a86ea-2").value = d.PROVINCIA
            d3.select("#oi-3a86ea-2").property("selectedIndex",i).dispatch("input change",{bubbles: true});
            var selectedProvincia = d3.select("#oi-3a86ea-2"); 

            var g = selectedProvincia.select(function() { return this.parentNode; })
            g.dispatch(new Event("input", {bubbles: true}));
            g.dispatch("input", {bubbles: true});
            //d3.select("#oi-3a86ea-2").property("value",3177).dispatch("input");
            //d3.select("#oi-3a86ea-2").dispatchEvent(new Event("input", {bubbles: true}));
            //this.dispatch("input");
            // stop iterating
            console.log("selectedIndex",g);
            break;
          }
      }
      

    })     ;


    d3.select("svg").
    selectAll(".province")
    .data(data)
    .join('.province')
  .select("title").text(function(d,i) { return d.PROVINCIA+ ", Producció: " + d.PROD+ "GWh, Any: " + d.YEAR + ", Tecnologia: " + d.TECNOLOGIA });

}
)}

function _36(md){return(
md`Funció principal que actualitza tots els gràfics.`
)}

function _updateAll(update_map,update_year){return(
function updateAll() {
  update_map(update_year());
}
)}

function _38(md){return(
md`## Conjunt de dades  `
)}

function _39(md){return(
md`_( Conjunts de dades a partir dels quals s'extreu la producció d'energia en les seves diferents *unitats*. Només hi ha un conjunt de dades original i a partir d'aquest es creen tres subconjunts de dades que tenen exactament la mateixa estructura però mostren diferents unitats de producció d'energia.)_`
)}

function _40(md){return(
md`Conjunt de dades després de netejar, estandaritzar e integrar altres fonts de dades. Les dades originals de producció d'Energia provenen del Ministeri per la transició ecològica i les de població i PIB de l'INE. Les dades s'han preprocessat e integrat utilitzant *scripts* de Perl.`
)}

function _prodEnergia(__query,FileAttachment,invalidation){return(
__query(FileAttachment("Generacion-Electrica-ALL_conCodigos_Observable@3.tsv"),{from:{table:"Generacion-Electrica-ALL_conCodigos_Observable"},sort:[],slice:{to:null,from:null},types:[{name:"CODIGO",type:"string"}],filter:[],select:{columns:null}},invalidation)
)}

function _42(md){return(
md`Conjunt de dades amb els valors de proucció d'energia ***Neta (GWH)***.`
)}

function _prodEnergiaSelectedProvNeta(selectProvincia,__query,prodEnergia,invalidation){return(
__query.sql(prodEnergia,invalidation,"prodEnergia")`SELECT CODIGO,PROVINCIA,TECNOLOGIA,PRODUCCION_NETA_GWH AS PROD,YEAR,CASE WHEN PROVINCIA =  ${selectProvincia} THEN 1  ELSE 0 END SELECTED FROM prodEnergia  ORDER BY YEAR,  PROVINCIA`
)}

function _44(md){return(
md`Conjunt de dades amb els valors de proucció d'energia Neta (GWH) ***normalitzada per la població*** de la província.`
)}

function _prodEnergiaSelectedProvPob(selectProvincia,__query,prodEnergia,invalidation){return(
__query.sql(prodEnergia,invalidation,"prodEnergia")`SELECT CODIGO,PROVINCIA,TECNOLOGIA,PROD_NETAGBH_X_HAB100K AS PROD,YEAR,CASE WHEN PROVINCIA =  ${selectProvincia} THEN 1  ELSE 0 END SELECTED FROM prodEnergia  ORDER BY YEAR,  PROVINCIA`
)}

function _46(md){return(
md`Conjunt de dades amb els valors de proucció d'energia Neta (GWH) ***normalitzada pel PIB*** de la província. No existeix dades del PIB per als dos darrers anys de l'interval.`
)}

function _prodEnergiaSelectedProvPib(selectProvincia,__query,prodEnergia,invalidation){return(
__query.sql(prodEnergia,invalidation,"prodEnergia")`SELECT CODIGO,PROVINCIA,TECNOLOGIA,PROD_NETAGWH_X_PIBG AS PROD,YEAR,CASE WHEN PROVINCIA =  ${selectProvincia} THEN 1  ELSE 0 END SELECTED FROM prodEnergia WHERE YEAR < 2021  ORDER BY YEAR,  PROVINCIA`
)}

function _48(updateAll){return(
updateAll()
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["Generacion-Electrica-ALL_conCodigos_Observable@3.tsv", {url: new URL("./files/72d95f2743104f3a980a35fcaaabae55f352d771196039340fd12846ed6f76d2e3804c875c99b6631077fedff2b97025fb3cb2652e15f0fd656cd95b7d398ba2.tsv", import.meta.url), mimeType: "text/tab-separated-values", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["htl"], _2);
  main.variable(observer("viewof selectMetric")).define("viewof selectMetric", ["Inputs"], _selectMetric);
  main.variable(observer("selectMetric")).define("selectMetric", ["Generators", "viewof selectMetric"], (G, _) => G.input(_));
  main.variable(observer("viewof selectYear")).define("viewof selectYear", ["Inputs","prodEnergiaSelectedProv"], _selectYear);
  main.variable(observer("selectYear")).define("selectYear", ["Generators", "viewof selectYear"], (G, _) => G.input(_));
  main.variable(observer("viewof selectTechnology")).define("viewof selectTechnology", ["Inputs","prodEnergiaSelectedProv"], _selectTechnology);
  main.variable(observer("selectTechnology")).define("selectTechnology", ["Generators", "viewof selectTechnology"], (G, _) => G.input(_));
  main.variable(observer("viewof selectProvincia")).define("viewof selectProvincia", ["Inputs","prodEnergia"], _selectProvincia);
  main.variable(observer("selectProvincia")).define("selectProvincia", ["Generators", "viewof selectProvincia"], (G, _) => G.input(_));
  main.variable(observer()).define(["md"], _7);
  main.variable(observer("viewof map")).define("viewof map", ["d3","projection","width","height","topojson","es"], _map);
  main.variable(observer("map")).define("map", ["Generators", "viewof map"], (G, _) => G.input(_));
  main.variable(observer("viewof plots")).define("viewof plots", ["vl","selectMetric","selectTechnology","selectYear","prodEnergiaSelectedProv","width","selectProvincia"], _plots);
  main.variable(observer("plots")).define("plots", ["Generators", "viewof plots"], (G, _) => G.input(_));
  main.variable(observer()).define(["vl","selectMetric","selectProvincia","selectYear","prodEnergiaSelectedProv","width"], _10);
  main.variable(observer()).define(["md"], _11);
  main.variable(observer()).define(["md"], _12);
  main.variable(observer()).define(["md"], _13);
  main.variable(observer("projection")).define("projection", ["composite","width","height","topojson","es"], _projection);
  main.variable(observer("es")).define("es", _es);
  main.variable(observer("height")).define("height", _height);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("topojson")).define("topojson", ["require"], _topojson);
  main.variable(observer("composite")).define("composite", ["require"], _composite);
  main.variable(observer("max")).define("max", ["get_max"], _max);
  main.variable(observer("min")).define("min", ["get_min"], _min);
  main.variable(observer("colorScale")).define("colorScale", ["getColorScale","selectTechnology"], _colorScale);
  main.variable(observer("prodEnergiaSelectedProv")).define("prodEnergiaSelectedProv", ["updateData"], _prodEnergiaSelectedProv);
  main.variable(observer()).define(["md"], _24);
  main.variable(observer()).define(["md"], _25);
  main.variable(observer()).define(["md"], _26);
  main.variable(observer("get_min")).define("get_min", ["d3","prodEnergiaSelectedProv","selectYear","selectTechnology"], _get_min);
  main.variable(observer("get_max")).define("get_max", ["d3","prodEnergiaSelectedProv","selectYear","selectTechnology"], _get_max);
  main.variable(observer("getColorScale")).define("getColorScale", ["d3","min","max"], _getColorScale);
  main.variable(observer()).define(["md"], _30);
  main.variable(observer("updateData")).define("updateData", ["selectMetric","prodEnergiaSelectedProvNeta","prodEnergiaSelectedProvPob","prodEnergiaSelectedProvPib"], _updateData);
  main.variable(observer()).define(["md"], _32);
  main.variable(observer("update_year")).define("update_year", ["topojson","es","prodEnergiaSelectedProv","selectYear","selectTechnology"], _update_year);
  main.variable(observer()).define(["md"], _34);
  main.variable(observer("update_map")).define("update_map", ["d3","colorScale","Event"], _update_map);
  main.variable(observer()).define(["md"], _36);
  main.variable(observer("updateAll")).define("updateAll", ["update_map","update_year"], _updateAll);
  main.variable(observer()).define(["md"], _38);
  main.variable(observer()).define(["md"], _39);
  main.variable(observer()).define(["md"], _40);
  main.variable(observer("prodEnergia")).define("prodEnergia", ["__query","FileAttachment","invalidation"], _prodEnergia);
  main.variable(observer()).define(["md"], _42);
  main.variable(observer("prodEnergiaSelectedProvNeta")).define("prodEnergiaSelectedProvNeta", ["selectProvincia","__query","prodEnergia","invalidation"], _prodEnergiaSelectedProvNeta);
  main.variable(observer()).define(["md"], _44);
  main.variable(observer("prodEnergiaSelectedProvPob")).define("prodEnergiaSelectedProvPob", ["selectProvincia","__query","prodEnergia","invalidation"], _prodEnergiaSelectedProvPob);
  main.variable(observer()).define(["md"], _46);
  main.variable(observer("prodEnergiaSelectedProvPib")).define("prodEnergiaSelectedProvPib", ["selectProvincia","__query","prodEnergia","invalidation"], _prodEnergiaSelectedProvPib);
  main.variable(observer()).define(["updateAll"], _48);
  return main;
}
