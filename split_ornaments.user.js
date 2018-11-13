// ==UserScript==
// @id             iitc-plugin-splitOrnaments
// @name           IITC plugin: Split ornaments and beacons into their own layers
// @author         Jormund
// @category       Layer
// @version        0.1.2.20181113.1520

// @description    [2018-11-13-1520] Split ornaments and beacons into their own layers
// @downloadURL    https://raw.githubusercontent.com/Jormund/split_ornaments/master/split_ornaments.user.js
// @include        https://ingress.com/intel*
// @include        http://ingress.com/intel*
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          https://intel.ingress.com/*
// @include        https://intel.ingress.com/*
// @match          http://*.ingress.com/intel*
// @grant          none
// ==/UserScript==

function wrapper(plugin_info) {
    if (typeof window.plugin !== 'function') window.plugin = function () { };

    // PLUGIN START ////////////////////////////////////////////////////////
    window.plugin.splitOrnaments = function () { };

    // init setup
    window.plugin.splitOrnaments.setup = function () {
        //add to setup
        window.ornaments._beaconLayer = L.layerGroup();
        window.ornaments._frackerLayer = L.layerGroup();
        window.addLayerGroup('Beacons', window.ornaments._beaconLayer, true);
        window.addLayerGroup('Frackers', window.ornaments._frackerLayer, true);

        //move already loaded items to the new layers
        $.each(window.ornaments._portals, function (guid, ornamentList) {
            $.each(ornamentList, function (index, marker) {
                var ornament = window.portals.options.data.ornaments[index];
                var layer = null; // window.ornaments._layer; //anomaly ornaments
                if (ornament == "peFRACK") {
                    layer = window.ornaments._frackerLayer; //frackers
                }
                else if (ornament.startsWith("pe")) {
                    layer = window.ornaments._beaconLayer; //other power-ups/beacons
                }
                if (layer != null) {
                    marker.addTo(layer);
                    window.ornaments._layer.removeLayer(marker);
                }
            });
        });

        //override total-conversion-build.user.js
        window.ornaments.addPortal = function (portal) {
            var guid = portal.options.guid;

            window.ornaments.removePortal(portal);

            var size = window.ornaments.OVERLAY_SIZE;
            var latlng = portal.getLatLng();

            if (portal.options.data.ornaments) {
                window.ornaments._portals[guid] = portal.options.data.ornaments.map(function (ornament) {
                    var layer = window.ornaments._layer; //anomaly ornaments
                    if (ornament == "peFRACK") {
                        layer = window.ornaments._frackerLayer; //frackers
                    }
                    else if (ornament.startsWith("pe")) {
                        layer = window.ornaments._beaconLayer; //other power-ups/beacons
                    }

                    var icon = L.icon({
                        iconUrl: "//commondatastorage.googleapis.com/ingress.com/img/map_icons/marker_images/" + ornament + ".png",
                        iconSize: [size, size],
                        iconAnchor: [size / 2, size / 2],
                        className: 'no-pointer-events'  // the clickable: false below still blocks events going through to the svg underneath
                    });

                    return L.marker(latlng, { icon: icon, clickable: false, keyboard: false, opacity: window.ornaments.OVERLAY_OPACITY }).addTo(layer);
                });
            }
        }

        //override total-conversion-build.user.js
        window.ornaments.removePortal = function (portal) {
            var guid = portal.options.guid;
            if (window.ornaments._portals[guid]) {
                window.ornaments._portals[guid].forEach(function (marker) {
                    window.ornaments._layer.removeLayer(marker);
                    window.ornaments._beaconLayer.removeLayer(marker);
                    window.ornaments._frackerLayer.removeLayer(marker);
                });
                delete window.ornaments._portals[guid];
            }
        }

        console.log('splitOrnaments loaded.');
    };

    var setup = window.plugin.splitOrnaments.setup;

    setup.info = plugin_info; //add the script info data to the function as a property
    if (!window.bootPlugins) window.bootPlugins = [];
    window.bootPlugins.push(setup);
    // if IITC has already booted, immediately run the 'setup' function
    if (window.iitcLoaded && typeof setup === 'function') {
        setup();
    }

    // PLUGIN END ////////////////////////////////////////////////////////    
} // WRAPPER END ////////////////////////////////////////////////////////    

var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('(' + wrapper + ')(' + JSON.stringify(info) + ');'));
(document.body || document.head || document.documentElement).appendChild(script);
