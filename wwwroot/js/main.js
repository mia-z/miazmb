$(document).ready(() => {
    createDb(count);
    $("#debug-box").append("<span>Querying api.</span>");
    $("#debug-box").append("<span id='amt-queried'></span>");
    $("#data-center-list")[0].selectedIndex = 0;
    $("#server-list")[0].selectedIndex = 0;
    $("#item-search").prop("disabled", true);
    $("#item-search").prop("value", "");
    $("#item-search").prop("placeholder", "Fetching items..");
});

const baseString = "https://xivapi.com"

var createDbTime = 0;
var count = 0;
var itemDb = [];
var dataCentersAndServers = [];

var searchBlocker;

var timer = setInterval(() => {
    createDbTime++;
}, 1);

fetch(baseString+"/servers/dc")
    .then(res => res.json())
    .then(res => {
        assignDropDowns(res);
    });

function createDb(count) {
    if (count < 97) {
        fetch(baseString+"/search?indexes=item&filters=ItemSearchCategory.ID>=9&page="+count)
            .then(res => res.json())
            .then(res => {
                count++;
                populateDb(res["Results"], count);
                createDb(count);
                if (count == 97) { 
                    clearTimeout(timer); 
                    $("#debug-box").append("<span> Found " + itemDb.length + " items in " + createDbTime + "ms" + "</span>");
                    $("#item-search").prop("placeholder", "Select a datacenter/server");
                }
            })
            .catch(err => {
                console.log("failed call: " + count + ", with error: " + err);
            })
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
    clearTimeout(searchBlocker);
    if ($(this).val() == "") {
        $("#search-results").empty();
        return;
    }
    searchBlocker = setTimeout(() => {
        createResults($("#item-search").val().toLowerCase());
    }, 500);
    //createResults($(this).val().toLowerCase());
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
    fetch(baseString+"/market/" + server + "/item/" + item.ID)
        .then(data => data.json())
        .then((data) => {
            console.log("found " + data)
            $("#search-results").append("" +
                "<div class='card card-animation' style='width: 15rem;' id='card-item-"+ item.ID + "'>" +
                    "<img class='card-img-top' src='" + baseString + item.Icon + "' alt='Card image top'>" +
                        "<div class='card-body'>" +
                        "<h5 class='card-title'>" + item.Name + "</h5>" +
                        "<p class='card-text'>Price: " + data["Prices"][0]["PricePerUnit"] + " gil</p>" +
                    "</div>" +
                "</div>");
            $("#card-item-"+item.ID).on("click", () => {
                fetch(baseString + "/item/" + item.ID)
                    .then(res => res.json())
                    .then(res => {
                        createModal(item, data, res);
                    });
            });
        })
        .catch(err => {
            console.log("failed at @ " + baseString+"/market/" + server + "/item/" + item.ID);
            console.log("reason: " + err)
        });
}

async function createModal(item, data, itemDetails) {
    console.log(item);
    console.log(data);
    console.log(itemDetails);
    $(".modal-box").append("" +
    "<div class='modal fade bd-example-modal-lg' tabindex='-1' role='dialog' aria-labelledby='myLargeModalLabel' aria-hidden='true'>" +
        "<div class='modal-dialog modal-lg' tabindex='-1' role='dialog' aria-labelledby='largeModal' aria-hidden='true'>" +
            "<div class='modal-content'>" +
                "<div class='modal-header'>" +
                    "<h5 class='modal-title'>" + item.Name + "</h5>" +
                    "<button type='button' class='btn btn-primary' data-dismiss='modal' aria-label='Close'>X</button>" +
                "</div>" +
                "<div class='modal-body'>" +
                    "<p>" + itemDetails["Description"] + "</p>" +
                "</div>" +
            "</div>" +
        "</div>" +
    "</div>");
    $(".modal").modal("show");
    $(".modal").on("hidden.bs.modal", () => {
        $(".modal-box").empty();
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

async function populateDb(data, count) {
    let baseH = count - 1;
    baseH = baseH * 100;
    await data.forEach(element => {
        baseH++;
        $("#amt-queried").text(" Queried " + baseH + " items.");
        itemDb.push(element);
    });
}

function convertEpoch(epochTime) {
    return new Date(epochTime * 1000);
}