/**
 * LMS-Material
 *
 * Copyright (c) 2018-2020 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

var iconMap = {};
var playerIcons = {};
var playerIdIconMap = {};

function getMiscJson(item, name, obj) {
    let cfg = getLocalStorageVal("misc-"+name);
    if (undefined!=cfg) {
        try {
            let data = JSON.parse(cfg);
            if (undefined!=data) {
                for (var x in item) if (item.hasOwnProperty(x)) delete item[x];
                for (let [key, value] of Object.entries(data)) {
                    item[key]=value;
                }
            }
        } catch(e) { }
    }

    if (item['material-version']!=LMS_MATERIAL_REVISION) {
        axios.get("html/misc/"+name+".json?r=" + LMS_MATERIAL_REVISION).then(function (resp) {
            let data = eval(resp.data);
            for (var x in item) if (item.hasOwnProperty(x)) delete item[x];
            data['material-version']=LMS_MATERIAL_REVISION;
            for (let [key, value] of Object.entries(data)) {
                item[key]=value;
            }
            setLocalStorageVal("misc-"+name, JSON.stringify(item));
            if (obj) {
               obj.$forceUpdate();
            }
        }).catch(err => {
            window.console.error(err);
        });
    } else if (obj) {
        obj.$forceUpdate();
    }
}

function initIconMap() {
    getMiscJson(playerIcons, "player-icons");
    getMiscJson(iconMap, "icon-map");

    // Get user set icons...
    let cfg = getLocalStorageVal("playerIdIconMap", undefined);
    if (cfg!=undefined) {
        playerIdIconMap = JSON.parse(cfg);
    }
    lmsCommand("", ["material-skin", "playericons"]).then(({data}) => {
        if (data && data.result && data.result.players) {
            for (var i=0, loop=data.result.players, len=loop.length; i<len; ++i) {
                playerIdIconMap[loop[i].id]=JSON.parse(loop[i].icon);
            }
            setLocalStorageVal("playerIdIconMap", JSON.stringify(playerIdIconMap));
        }
    });
}

function mapPlayerIcon(player) {
    if (undefined!=playerIdIconMap && undefined!=playerIdIconMap[player.playerid]) {
        return playerIdIconMap[player.playerid];
    }
    if (undefined!=playerIcons) {
        let model = playerIcons[player.model];
        if (undefined!=model) {
            if (undefined!=model['icon'] || undefined!=model['svg']) {
                return model;
            }
            if (undefined!=model[player.modelname]) {
                return model[player.modelname];
            }
            if (undefined!=player.firmware && undefined!=model['firmware']) {
                for (let i=0, len=model['firmware'].length; i<len; ++i) {
                    if (model['firmware'][i]['ends'] && ('' + player.firmware).endsWith(model['firmware'][i]['ends'])) {
                        return model['firmware'][i];
                    }
                }
            }
            if (undefined!=player.playerid && undefined!=model['playerid']) {
                for (let i=0, len=model['playerid'].length; i<len; ++i) {
                    if (model['playerid'][i]['begins'] && ('' + player.playerid).startsWith(model['playerid'][i]['begins'])) {
                        return model['playerid'][i];
                    }
                }
            }
        }
    }

    return {icon:"speaker"};
}

function mapIconType(item, app, type) {
    let lmsIcon = item[type];
    if (undefined==lmsIcon || (typeof lmsIcon !== 'string')) {
        return false;
    }
    if (lmsIcon.indexOf("imageproxy/")>=0) {
        return false;
    }
    for (const [key, value] of Object.entries(iconMap["endsWith"])) {
        if (lmsIcon.endsWith(key) || lmsIcon.endsWith(key+"/image.png")) {
            let entry = undefined!=app && undefined!=value[app] ? value[app] : value;
            if (entry['icon']) {
                item.image=item[value]=item.svg=undefined; item.icon=entry['icon'];
            } else if (entry['svg']) {
                item.image=item[value]=item.icon=undefined; item.svg=entry['svg'];
            }
            return true;
        }
    }
    for (const [key, value] of Object.entries(iconMap["indexOf"])) {
        if (lmsIcon.indexOf(key)>0) {
            let entry = undefined!=app && undefined!=value[app] ? value[app] : value;
            if (entry['icon']) {
                item.image=item[value]=item.svg=undefined; item.icon=entry['icon'];
            } else if (entry['svg']) {
                item.image=item[value]=item.icon=undefined; item.svg=entry['svg'];
            }
            return true;
        }
    }
    return false;
}

function mapIcon(item, app, fallback) {
    if (undefined==iconMap) {
        return false;
    }
    if (mapIconType(item, app, "icon-id")) {
        return true;
    }
    if (mapIconType(item, app, "icon")) {
        return true;
    }
    if (item.image && item.image.startsWith("html/images/") && mapIconType(item, app, "image")) {
        return true;
    }
    if (undefined!=fallback) {
        item.icon=fallback.icon; item.svg=fallback.svg; item.image=undefined;
        return true;
    }
    return false;
}
