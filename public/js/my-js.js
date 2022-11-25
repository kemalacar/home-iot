
var selectedDate;
var selecteNode;

$(document).ready(function () {


    getNodes();

    $('body').on('click', '.node', function () {
        getAllByNodes($(this).data("id"));
    });

    $("#datepicker").datepicker().datepicker("setDate", new Date());
    selectedDate = $("#datepicker").datepicker().datepicker("getDate");

    $("#datepicker").on("change",function(){
        selectedDate = $(this).val();
        getAllByNodes();
    });

    setAmchart();
});


function getNodes() {
    $.get("/api/get-nodes", function (data) {
        if (data) {
            data.forEach(item => {
                $(".nodes").append("  <li><a class='node' data-id='" + item._id + "' href=\"#\">" + item._id + "</a></li>");
            });
            if(data[0]){
                selecteNode = data[0]._id;
                getAllByNodes();
            }
        }
    });
}

function getAllByNodes() {



    sendAjax('/api/getall-by-node', {"node": selecteNode,"date":selectedDate}, function (data) {

        $(".table-body tr").remove();

        data.forEach(item => {

            var date = new Date(item.date);


            $(".table-body").append("<tr>" +
                // "<td>" + item._id + "</td>" +
                "<td>" + item.node + "</td>" +
                "<td>" + item.temperature + "</td>" +
                "<td>" + item.temperature2 + "</td>" +
                "<td>" + item.humidity + "</td>" +
                // "<td>" + new Date(item.date) + "</td>" +
                "<td>" + date.getHours()+":" +date.getMinutes()+":" +date.getSeconds()+"</td>" +
                "</tr>");
        });
        setAmchart(data);

    });

}

function sendAjax(url, data, successCallBack) {
    $.ajax({
        type: 'POST',
        data: JSON.stringify(data),
        contentType: "application/json",
        url: url,
        success: function (data) {
            successCallBack(data);
        }
    });
}


function setAmchart(data) {

    var selfData = data;
    am4core.ready(function() {

// Themes begin
        am4core.useTheme(am4themes_animated);
// Themes end
        var chart = am4core.create("chartdiv", am4charts.XYChart);
        chart.paddingRight = 20;

        var data = [];
        var visits = 10;
        var previousValue;

        if(!selfData){
            return;
        }

        var tempDate = new Date();
        tempDate.setHours(0,0,0,0);

        for (var i = 0; i < 144; i++) {
            tempDate.setMilliseconds(tempDate.getMilliseconds() +1000*60*10);
            data.push({ date: tempDate, value:null });
        }

        for (var i = 15; i < 24; i++) {
            data.push({ date: null, value:i });
        }


        selfData.forEach(item => {
            data.push({ date: new Date(item.date), value: item.temperature });
        });


        chart.data = data;

        var dateAxis = chart.xAxes.push(new am4charts.DateAxis());
        dateAxis.renderer.grid.template.location = 0;
        dateAxis.renderer.axisFills.template.disabled = true;
        dateAxis.renderer.ticks.template.disabled = true;

        var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
        valueAxis.tooltip.disabled = true;
        valueAxis.renderer.minWidth = 35;
        valueAxis.renderer.axisFills.template.disabled = true;
        valueAxis.renderer.ticks.template.disabled = true;

        var series = chart.series.push(new am4charts.LineSeries());
        series.dataFields.dateX = "date";
        series.dataFields.valueY = "value";
        series.strokeWidth = 2;
        series.tooltipText = "{valueY} ℃ ";
        // var bullet = series.bullets.push(new am4charts.CircleBullet());

// set stroke property field
        series.propertyFields.stroke = "color";

        chart.cursor = new am4charts.XYCursor();

        var scrollbarX = new am4core.Scrollbar();
        chart.scrollbarX = scrollbarX;

        dateAxis.start = 0.7;
        // dateAxis.keepSelection = true;






    }); // end am4core.ready()
}