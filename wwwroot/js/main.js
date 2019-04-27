$(document).ready(() => {
    createDb(count);
    $("#debug-box").append("<span>Querying api.</span>");
    $("#data-center-list")[0].selectedIndex = 0;
    $("#server-list")[0].selectedIndex = 0;
    $("#item-search").prop("disabled", true);
    $("#item-search").prop("value", "");
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
                    $("#item-search").prop("placeholder", "Select a datacenter/server");
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

$("#server-list").on("change", function(evt) {
    $("#item-search").prop("disabled", false);
    $("#item-search").prop("placeholder", "Start typing to search..");
});

$("#item-search").on("input", function(evt) {
    if ($(this).val() == "") {
        $("#search-results").empty();
        return;
    }
    createResults($(this).val().toLowerCase());
});

async function createResults(query) {
    var results = itemDb.filter(n => n.Name.toLowerCase().includes(query));
    $("#search-results").empty();
    let max = results.length > 10 ? 10 : results.length;
    for (let c = 0; c < max; c++) {
        createCard($("#server-list").val(), results[c]);
    }
}

async function createCard(server, item) {
    $.ajax({
        url: baseString+"/market/" + server + "/item/" + item.ID,
        dataType: "json",
        success: function(data) {
            console.log("found " + data);
        },
        error: function (err) {
            console.log("failed at @ " + baseString+"/market/" + server + "/item/" + item.ID);
        }
    }).done((data) => {
        $("#search-results").append("" +
            "<div class='card' style='width: 15rem;'>" +
                "<img class='card-img-top' src='" + baseString + item.Icon + "' alt='Card image top'>" +
                    "<div class='card-body'>" +
                    "<h5 class='card-title'>" + item.Name + "</h5>" +
                    "<p class='card-text'>Price: " + data["Prices"][0]["PricePerUnit"] + " gil</p>" +
                "</div>" +
            "</div>");
    });
}

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