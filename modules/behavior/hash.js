import _throttle from 'lodash-es/throttle';

import { select as d3_select } from 'd3-selection';

import { utilDisplayLabel } from '../util';
import { geoSphericalDistance } from '../geo';
import { modeBrowse } from '../modes/browse';
import { utilObjectOmit, utilQsString, utilStringQs } from '../util';


export function behaviorHash(context) {
    var s0 = null; // cached window.location.hash
    var lat = 90 - 1e-8; // allowable latitude range


    var parser = function(map, s) {
        var q = utilStringQs(s);
        var args = (q.map || '').split('/').map(Number);

        if (args.length < 3 || args.some(isNaN)) {
            return true; // replace bogus hash

        } else if (s !== formatter(map).slice(1)) {   // hash has changed
            var mode = context.mode();
            var dist = geoSphericalDistance(map.center(), [args[2], args[1]]);
            var maxdist = 500;

            // Don't allow the hash location to change too much while drawing
            // This can happen if the user accidently hit the back button.  #3996
            if (mode && mode.id.match(/^draw/) !== null && dist > maxdist) {
                context.enter(modeBrowse(context));
            }
            map.centerZoom([args[2], Math.min(lat, Math.max(-lat, args[1]))], args[0]);
        }
    };


    var formatter = function(map) {
        var center = map.center();
        var zoom = map.zoom();
        var precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));
        var q = utilObjectOmit(utilStringQs(window.location.hash.substring(1)),
            ['comment', 'source', 'hashtags', 'walkthrough']
        );
        var newParams = {};

        delete q.id;
        var selected = context.selectedIDs().filter(function(id) {
            return !context.entity(id).isNew();
        });
        if (selected.length) {
            newParams.id = selected.join(',');
        }
 
        newParams.map = zoom.toFixed(2) +
            '/' + center[1].toFixed(precision) +
            '/' + center[0].toFixed(precision);

        updateTitle(selected, center[1].toFixed(precision), center[0].toFixed(precision));

        return '#' + utilQsString(Object.assign(q, newParams), true);
    };

    function updateTitle(selected, center1, center0){
        //selection
        var oldTitle = document.title;
        var endIndex = oldTitle.indexOf('-');
        var oldIDStr = oldTitle.substring(endIndex+2);
        if (selected.length === 1) {
            if (endIndex === -1) {
                oldTitle += ' - ' + utilDisplayLabel(context.entity(selected[0]), context);
            }
            else {
                var newIDStr = utilDisplayLabel(context.entity(selected[0]), context);
                oldTitle = oldTitle.replace(oldIDStr, newIDStr);
            }
        }
        else if (selected.length > 1 ) {
            newIDStr = utilDisplayLabel(context.entity(selected[0]), context) + ' and ' + (selected.length-1).toString() + ' more';
            oldTitle = oldTitle.replace(oldIDStr, newIDStr);
        }
        else {
            if (endIndex !== -1){
                oldIDStr = oldTitle.substring(endIndex);
                oldTitle = oldTitle.replace(oldIDStr, '');
            }
            //map location
            oldTitle += ' - (' + center1 + ',' + center0 + ')';
        }

        document.title = oldTitle;

    }


    function update() {
        if (context.inIntro()) return;
        var s1 = formatter(context.map());
        if (s0 !== s1) {
            var ids1 = s1.indexOf('id=');
            var arrayIds1;
            if (ids1 !== -1){
                var substrS1 = s1.substring(ids1+3);
                ids1 = substrS1.indexOf('&');
                substrS1 = substrS1.substring(0, ids1);
                arrayIds1 = substrS1.split(',');
            }

            var ids0 = s0.indexOf('id=');
            var arrayIds0;
            if (ids0 !== -1){
                var substrS0 = s0.substring(ids0+3);
                ids0 = substrS0.indexOf('&');
                substrS0 = substrS0.substring(0, ids0);
                arrayIds0 = substrS0.split(',');
            }

            var equalArrays = false;
            if (arrayIds0 && arrayIds1 && arrayIds1.length === arrayIds0.length){
                equalArrays = true;
                arrayIds1.forEach((x1,i) => {
                    equalArrays = equalArrays && arrayIds0.includes(x1);
                    console.log(arrayIds0.includes(x1));
                })
            }
            if(!equalArrays && (arrayIds0 || arrayIds1)){
                console.log('push state');
                history.pushState(null, document.title, window.location.href);
            }
            s0 = s1;
            window.location.replace(s0);  // don't recenter the map!
        }
    }


    var throttledUpdate = _throttle(update, 500);


    function hashchange() {
        if (window.location.hash === s0) return;  // ignore spurious hashchange events
        if (parser(context.map(), (s0 = window.location.hash).substring(1))) {
            update(); // replace bogus hash
        }
    }


    function behavior() {
        context.map()
            .on('move.hash', throttledUpdate);

        context
            .on('enter.hash', throttledUpdate);

        d3_select(window)
            .on('hashchange.hash', hashchange);

        if (window.location.hash) {
            var q = utilStringQs(window.location.hash.substring(1));

            if (q.id) {
                if (!context.history().hasRestorableChanges()) {
                    // targeting specific features: download, select, and zoom to them
                    context.zoomToEntities(q.id.split(','));
                }
            }                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

            // Store these here instead of updating local storage since local
            // storage could be flushed if the user discards pending changes
            if (q.comment)  behavior.comment = q.comment;
            if (q.source)   behavior.source = q.source;
            if (q.hashtags) behavior.hashtags = q.hashtags;

            if (q.walkthrough === 'true') {
                behavior.startWalkthrough = true;
            }

            hashchange();

            if (q.map) {
                behavior.hadHash = true;
            }
        }
    }


    behavior.off = function() {
        throttledUpdate.cancel();

        context.map()
            .on('move.hash', null);

        context
            .on('enter.hash', null);

        d3_select(window)
            .on('hashchange.hash', null);

        window.location.hash = '';
    };


    return behavior;
}
