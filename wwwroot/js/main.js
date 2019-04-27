$(document).ready(() => {
    createDb(count);
    $("#debug-box").append("<span>Querying api.</span>");
    $("#data-center-list")[0].selectedIndex = 0;
    $("#server-list")[0].selectedIndex = 0;
    $("#item-search").prop("disabled", true);
    $("#item-search").prop("placeholder", "Fetching items..");
});

var baseString = "https://xivapi.com"
var createDbTime = 0;
var count = 1;
var itemDb = [];
var dataCentersAndServers = [];

var timer = setInterval(() => {
    createDbTime++;
}, 1);

$.ajax({
    url: baseString+"/servers/dc",
    dataType: "json",
    success: function(data) {
        assignDropDowns(data);
    }
});

function createDb(count) {
    if (count < 97) {
        $.ajax({
            type: "GET",
            url: baseString+"/search?indexes=item&filters=ItemSearchCategory.ID>=9&page="+count,
            dataType: "json",
            success: function(data) {
                count++;
                populateDb(data["Results"]);
                createDb(count);
                if (count == 97) { 
                    clearTimeout(timer); 
                    $("#debug-box").append("<span> Found " + itemDb.length + " items in " + createDbTime + "ms" + "</span>");
                    $("#item-search").prop("disabled", false);
                    $("#item-search").prop("placeholder", "Start typing to search..");
                }
            },
            error: function(data) {
                console.log("failed call: " +count);
            }
        });
    }
    if (count == 97) {
        console.log(itemDb);
    }
}

$("#data-center-list").on("change", function(evt) {
    $("#server-list").prop("disabled", false);
    populateDropDown($(this).val());
});

$("#item-search").on("input", function(evt) {
    if ($(this).val() == "") {
        $("#search-results").empty();
        return;
    }
    $("#current-search").text($(this).val());
    var results = itemDb.filter(n => n.Name.toLowerCase().includes($(this).val()));
    console.log(results);
    $("#search-results").empty();
    let max = results.length > 30 ? 30 : results.length
    for (let c = 0; c < max; c++) {
        console.log("im here");
        $("#search-results").append("" +
        "<div class='card' style='width: 15rem;'>" +
            "<img class='card-img-top' src='" + baseString + results[c].Icon + "' alt='Card image top'>" +
                "<div class='card-body'>" +
                "<h5 class='card-title'>" + results[c].Name + "</h5>" +
                "<p class='card-text'>Placeholder</p>" +
            "</div>" +
        "</div>");
    }
});

async function assignDropDowns(response) {
    dataCentersAndServers = await response;
    console.log(dataCentersAndServers);
}

function populateDropDown(source) {
    selectedDc = dataCentersAndServers[source];
    $("#server-list").empty();
    $("#server-list").append("<option selected disabled hidden>Select Server</option>");
    selectedDc.forEach(function(element) {
        $("#server-list").append("<option value='" + element + "'>" + element + "</option>");
    });
}

async function populateDb(data) {
    await data.forEach(element => {
        itemDb.push(element);
    });
}