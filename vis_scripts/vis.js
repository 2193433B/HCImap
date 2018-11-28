var simdData;
var alcoholData;
var detailData;

var width = 600;
var height = 600;

var svg;
var features;
var zoom;
var projection;
var path;

function buildMap(type){

    d3.select("#viz_one").html("");
    if(type == "deprivation"){
        d3.csv("https://raw.githubusercontent.com/2193433B/HCImap/master/simd_data.csv", function(data) {
          dataLoaded(data, type);
        });
    }

    if(type == "alcohol"){
        d3.csv("https://raw.githubusercontent.com/2193433B/HCImap/master/alcohol_data.csv", function(data){
            alcoholLoaded(data, type);
        });
    }

    if(type == "both"){
        d3.csv("https://raw.githubusercontent.com/2193433B/HCImap/master/alcohol_data.csv", function(data){
            alcoholLoaded(data, type);
        });
        d3.csv("https://raw.githubusercontent.com/2193433B/HCImap/master/simd_data.csv", function(data) {
            dataLoaded(data, type);
        });
    }
    //Map projection
    projection = d3.geo.mercator()
        .scale(2790.313683684819)
        .center([-4.687308351132869,57.88149740071447]) //projection center
        .translate([width/2,height/2]) //translate to center the map in view

    //Generate paths based on projection
    path = d3.geo.path()
        .projection(projection);


    d3.select("#viz_one")
       .append("div")
       .classed("svg-container", true) //container class to make it responsive
       .append("svg")
       .attr("id", "svg-sizer")
       //responsive SVG needs these 2 attributes and no width and height attr
       .attr("preserveAspectRatio", "xMinYMin meet")
       .attr("viewBox", "0 0 600 600")
       //class to make it responsive
       .classed("svg-content-responsive", true);


    //Create an SVG
    svg = d3.select("#svg-sizer").append("svg")
        .attr("width", width)
        .attr("height", height);

    //Group for the map features
    features = svg.append("g")
        .attr("class","features");

    //Create zoom/pan listener
    //Change [1,Infinity] to adjust the min/max zoom scale
    zoom = d3.behavior.zoom()
        .scaleExtent([1, 5])
        .on("zoom",zoomed);

    svg.call(zoom);
}



//Create a tooltip, hidden at the start
var tooltip = d3.select("body").append("div").attr("class","tooltip");

function drawMap(type){
    d3.json("https://raw.githubusercontent.com/2193433B/HCImap/master/topo_corrected.topojson", function(error,geodata) {
      if (error) return console.log(error); //unknown error, check the console

      features.selectAll("path")
        .data(topojson.feature(geodata,geodata.objects.lad).features) //generate features from TopoJSON
        .enter()
        .append("path")
        .attr("d",path)
        .attr("opacity", 1)
        .attr("fill", function(cA){return colorByCouncilArea(cA.properties.LAD13CD, type);})
        .on("mouseover",showTooltip)
        .on("mousemove",moveTooltip)
        .on("mouseout",hideTooltip)
        .on("click",clicked);

    });


    if(type == "alcohol"){
        document.getElementById("alcoholButton").className="button small"
        document.getElementById("deprivationButton").className="button alt small"
        document.getElementById("bothButton").className="button alt small"
        document.getElementById("alcohol_info").style.display = 'block';
        document.getElementById("both_info").style.display = 'none';
        document.getElementById("deprivation_info").style.display = 'none';

    }
    if(type == "deprivation"){
        document.getElementById("alcoholButton").className="button alt small"
        document.getElementById("deprivationButton").className="button small"
        document.getElementById("bothButton").className="button alt small"
        document.getElementById("alcohol_info").style.display = 'none';
        document.getElementById("both_info").style.display = 'none';
        document.getElementById("deprivation_info").style.display = 'block';
    }
    if(type == "both"){
        document.getElementById("alcoholButton").className="button alt small"
        document.getElementById("deprivationButton").className="button alt small"
        document.getElementById("bothButton").className="button small"
        document.getElementById("alcohol_info").style.display = 'none';
        document.getElementById("both_info").style.display = 'block';
        document.getElementById("deprivation_info").style.display = 'none';
    }



}


buildMap("alcohol");

function dataLoaded(data, type){
    simdData = data;
    drawMap(type);
}

function alcoholLoaded(data, type){
    alcoholData = data;
    drawMap(type);
}


// Add optional onClick events for features here    // console.log(data[1]["Number of Patients"]);

// d.properties contains the attributes (e.g. d.properties.name, d.properties.population)
function clicked(d,i) {

    console.log(d.properties.LAD13NM);
    document.getElementById("info_Name").innerHTML="Proportions of cases in The " + d.properties.LAD13NM + " Area";
    window.scrollBy(0, 2000);

    d3.select("#viz_two").html("");

    d3.csv("https://raw.githubusercontent.com/2193433B/HCImap/master/alc_condition_data.csv", function(data) {
      displayDetail(data, d.properties.LAD13CD);
    });


}

function displayDetail(data, councilArea){

    var dataset = [];

    var startIndex = -1;
    for (i in data){
        if(data[i]["Council Area"] === councilArea){
            startIndex = i;
            break;
        }
    }

    for (i = startIndex; i < (+startIndex+7); i++) {
        // console.log(data[i]["Number of Patients"]);
        dataset.push(data[i]["Number of Patients"]);
    }


    document.getElementById("detail_title").innerHTML = "";

    console.log("Start index = " + startIndex);

    var svgWidth = 1400;
    var svgHeight = 400;
    var bars_svg = d3.select('#viz_two')
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .attr("class", "bar-chart");

    var barPadding = 35;
    var barWidth = (svgWidth / dataset.length);
    var barChart = bars_svg.selectAll("viz_two")
        .data(dataset)
        .enter()
        .append("rect")
        .attr("y", function(d) {
            return svgHeight - d
        })
        .attr("height", function(d) {
            return d;
        })
        .attr("fill", function (d){ return "#FFF"; })
        .attr("width", barWidth - barPadding)
        .attr("transform", function (d, i) {
             var translate = [barWidth * i, 0];
             return "translate("+ translate +")";

        })
        .append("text")
        .enter()
        .text( function (d) { return "( " + ", " +" )"; });

}

//Update map on zoom/pan
function zoomed() {
  features.attr("transform", "translate(" + zoom.translate() + ")scale(" + zoom.scale() + ")")
      .selectAll("path").style("stroke-width", 1 / zoom.scale() + "px" );
}


//Position of the tooltip relative to the cursor
var tooltipOffset = {x: 5, y: -25};

//Create a tooltip, hidden at the start
function showTooltip(d) {
  moveTooltip();

  tooltip.style("display","block")
      .text(d.properties.LAD13NM + "\n" + d.properties.LAD13CD);
}

//Move the tooltip to track the mouse
function moveTooltip() {
  tooltip.style("top",(d3.event.pageY+tooltipOffset.y)+"px")
      .style("left",(d3.event.pageX+tooltipOffset.x)+"px");
}

//Create a tooltip, hidden at the start
function hideTooltip() {
  tooltip.style("display","none");
}

function getSIMDstat(target){
    for(i in simdData){
        if(simdData[i]["Council Area"] === target){
            return simdData[i]["SIMD2016Rank"];
        }
    }
    return 0;
}


function getAlcoholstat(target){
    for(i in alcoholData){
        if(alcoholData[i]["Council Area"] === target){
            return (alcoholData[i]["Average"] -1)*5;
        }
    }
    return 0;
}

function colorByCouncilArea(councilArea, visType){
    var stat;
    var color;

    if(visType == "alcohol"){
        stat = getAlcoholstat(councilArea);
        color = d3.lab(stat * 50, -100, -100);
    }

    if(visType == "deprivation"){
        stat = getSIMDstat(councilArea);
        color = d3.lab(stat * 100, 100, 100);
    }

    if(visType == "both"){
        statDepr = getSIMDstat(councilArea);
        statAlc = getAlcoholstat(councilArea);

        color = d3.lab(((statDepr * statAlc)) * 100, 50, -50);
    }

    return color + "";

}
