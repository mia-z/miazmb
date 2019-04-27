$(document).ready(() => {
    
});

var dataCentersAndServers = [];

$.ajax({
    url:"https://xivapi.com/servers/dc",
    dataType: "json",
    success: function(data) {
        assignDropDowns(data);
    }
});

$("#data-center-list").on("change", function(evt) {
    $("#server-list").prop("disabled", false);
    populateDropDown($(this).val());
});

$("#server-list").on("change", function(evt) {

});

async function assignDropDowns(response) {
    dataCentersAndServers = await response;
    console.log(dataCentersAndServers);
}

function populateDropDown(source) {
    selectedDc = dataCentersAndServers[source];
    $("#server-list").empty();
    selectedDc.forEach(function(element) {
        $("#server-list").append("<option value='" + element + "'>" + element + "</option>");
    });
}