//Copyright (C) 2012 fuho - https://github.com/fuho
/* This program is free software. It comes without any warranty, to
 * the extent permitted by applicable law. You can redistribute it
 * and/or modify it under the terms of the Do What The Fuck You Want
 * To Public License, Version 2, as published by Sam Hocevar. See
 * http://sam.zoy.org/wtfpl/COPYING for more details. */

//TODO: Rewrite the code, maek it cleaner.
//TODO: Fix the flickering
//TODO: Mouse middle button cotnrol (some event handling written already)
//TODO: Turn it into an extension, preferably usning the same source for both.
//DONE: Stop UI from covering up content in the corner.
//DONE: Animate index to it's original position when window position reaches the top.


var css = "",
    html="";

// CSS definitions    
css += ".ui-sortable-helper { background-color: rgba(9, 46, 32, 0.8);} \n";
css += ".ui-sortable-placeholder { float:left; background-color: rgba(9, 46, 32, 0.8);} \n";
css += "#ui-control-panel {position: fixed; top:20px; left: 140px; background-color: #092E20; padding: 10px; } \n";
css += ".ui-control-panel-cornered {\n";
css += "    -webkit-border-bottom-right-radius: 10px;\n";
css += "    -moz-border-radius-bottomright: 10px;\n";
css += "    border-bottom-right-radius: 10px;\n";
css += "    top: 0 !important; left: 0 !important;";
css += "    opacity: 0.05; \n";
css += "    transition: opacity 2s linear;\n";
css += "    -webkit-transition: opacity 2s linear;\n";
css += "    -moz-transition: opacity 2s linear;\n";
css += "    -o-transition: opacity 2s linear;\n";
css += "    }\n";
css += ".ui-control-panel-cornered:hover {\n";
css += "    opacity: 1; \n";
css += "    transition: opacity 0.2s linear;\n";
css += "    -webkit-transition: opacity 0.2s linear;\n";
css += "    -moz-transition: opacity 0.2s linear;\n";
css += "    -o-transition: opacity 0.2s linear;\n";
css += "    }\n";
css += "#content-main { overflow:hidden;} \n";
css += "#content-related { overflow:hidden; position:relative;} \n";
css += "#content-related ul{ border-left: 1px dashed #00631C} \n";
css += "#text-help {margin-left:10px; font-family:'Lucida Console', Monaco, monospace, font-size: 20px;}";
css += ".ui-mouse-target {\n";
css += "    position: absolute; width:50px; height:50px; margin: -25px 0 0 -25px;\n";
css += "    -webkit-border-radius: 25px;\n";
css += "    -moz-border-radius: 25px;\n";
css += "    border-radius: 25px;\n";
css += "    background-color: rgba(0,0,0,0.5);\n";
css += "    }\n";
css += "\n";

// Html for injected user interface control panel
html +='<div id="ui-control-panel">'
html +='<input type="checkbox" id="toggle-index"/><label id="toggle-index-label" for="toggle-index" title="Also try dragging the index to <br/> whichever side you prefer." >Toggle Index</label>'
html +='<div id="content-ratio" style="display:inline-block; width:120px; margin:0 10px 0 10px;"></div>'
//html +='<span id="text-help">You can drag the index left or right.</span>'
html +='</div>'

function go () {
    $(document).tooltip();
    $(document.head).append('<style type="text/css">' + css + '</style>');
    $(document.body).append(html);

    var div_column_wrap             = $("#columnwrap").sortable({
            placeholder             : "ui-sortable-placeholder",
            forcePlaceholderSize    : true,
            cancel                  : "#content-main"
            }).children().css("float","left"),
        body                        = $("body"),
        content                     = $("#content-main"),
        index                       = $("#content-related"),
        ui                          = $("#ui-control-panel"),
        ui_original_top             = ui.css("top"),
        ui_original_left            = ui.css("left"),
        ui_offset_flag              = false,
        current_ratio               = 70,
        slider_ratio                = $("#content-ratio").slider({
            range                   : "min",
            min                     : 35,
            max                     : 100,
            value                   : current_ratio,
            step                    : 5,
            change                  : changeContentRatio,
            slide                   : changeContentRatio
            }),
        btn_toggle_index            = $("#toggle-index").button()
            .click(function(){ toggle_index();}),
        i_min                       = index.offset().top,
        il                         = index.offset().left,
        i_max                       = index.parent().innerHeight() +index.parent().offset().top,
        wt_old                      = window.pageYOffset,
        dir_old                     = 0;
        
    function toggle_index(){
        index.toggle();
        if(index.is(":hidden")) {
            current_ratio = slider_ratio.slider('option', 'value');
            slider_ratio.slider('option', 'value', 100).slider("disable");
        }else{
            slider_ratio.slider('option', 'value', current_ratio).slider("enable");
        }
    }
    
    function glue_ui(){
        // Glue UI to the corner when user scrolls
        if( window.pageYOffset && ! ui_offset_flag){
            ui.addClass("ui-control-panel-cornered");
            ui_offset_flag = true;
        }
        //and unglue when he reaches the top again
        else if (! window.pageYOffset && ui_offset_flag){
            ui.removeClass("ui-control-panel-cornered");
            ui_offset_flag = false;
        }
    }

    function move_index(){
        // Keep index at hand (visible in viewport)
        var wt      = window.pageYOffset,
            it      = index.offset().top,
            wh      = window.innerHeight,
            ih      = index.innerHeight(),
            wb      = wt + wh,
            ib      = it + ih,
            w_gt_i  = wh > ih ? true : false,
            delta   = wt - wt_old,
            dir     = delta > 0 ? 1 : -1
            up      = delta < 0 ? true  :false,
            down    = delta > 0 ? true  :false,
            
            anim_t  = 0,
            easing  = "easeOutSine";
        
        if(wt < i_min){
            index.animate(
                {top: 0},
                100,
                easing
            );
        }
        //setting top (smaller and pushing down or bigger and pulling up )
        else if( ((wt > it) && (wb > ib) && w_gt_i)
          || ((wt < it) && (wb < ib)) && !w_gt_i){
            index.offset({ top: wt < i_min ? i_min : wt });
            /* animating option below. pulls too much attention from documentation
            index.stop(true);
            //   if      i_max visible then    otherwise caluclate normally
            index.animate(
                { top: wt < i_min ? 0 : wt - i_min },
                anim_t,
                easing
            );
            */
        }
        //setting bottom (smaller and pushing up or bigger and pulling down )
        else if( ((wt < it) && (wb < ib) && w_gt_i)
          || ((wt > it) && (wb > ib)) && !w_gt_i){
            index.offset({ top: wb > i_max ? i_max - ih : wb - ih });
            /*
            index.stop(true);
            //   if      i_max visible then    otherwise caluclate normally
            index.animate(
                { top: wb > i_max ? i_max - (ih + i_min) : wb - (ih +i_min)},
                anim_t,
                easing
            );
            */ 
        }
    }
    
    function changeContentRatio(event,ui){
        content.css("width", ui.value + "%");
        index.css("width", (100 - ui.value) + "%");
        //if content width changed recalculate index max bottom position!
        i_max = index.parent().innerHeight() +index.parent().offset().top;
   }
 /*   
    function ui_mouse_control(e){
        var start_x =e.pageX,
            start_y = e.pageY,
            start_offsetX =e.offsetX,
            start_offsetY =e.offsetY,
            element = undefined,
            state = undefined;

        function start_drag(){
            state = "DRAGGING";
            element = $(document.createElement("div"))
                .addClass("ui-mouse-target")
                .offset({top: start_y, left: start_x});
            element.appendTo("body");
            console.log(e);
            console.log("start drag");
        }

        function exec_drag(e){
            element.stop(true, true);
            element.animate({top:e.pageY,left:e.pageX});
            var h = window.innerHeight,
                dy = start_offsetY - e.offsetY;

            $('html, body').animate({scrollTop: window.pageYOffset + dy}, 1);
            //console.log("dragging");
        }

        function stop_drag(e){
            delete state;
            
            $(document).off("mousemove.injectdocsui");
            
            element.detach();
            console.log("stop drag");
        }

        if(e.which == 2 && typeof state == "undefined" ){
            start_drag();
            $(document).on({
                'mousemove.injectdocsui'     : exec_drag,
                'mouseup.injectdocsui'       : stop_drag
            });
        }
    }

    $(document).on('mousedown.injectdocsui', ui_mouse_control);    
*/

    $(window).scroll(function(){
        move_index();
        glue_ui();
    })
    //trigger scroll (in case of script run while scrolled in midpage)
    window.scrollTo(window.pageXOffset, window.pageYOffset+1);
    window.scrollTo(window.pageXOffset, window.pageYOffset-1);
    window.injectDocsUIenabled = true;
}

function check_jQuery () {
    if (typeof window.jQuery == 'undefined') {
        window.setTimeout(check_jQuery, 100);
    }else{
        if (typeof window.jQuery.ui == 'undefined') {
            $(document.head).append('<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.9.1/jquery-ui.min.js"/>');
            $(document.head).append('<link rel="stylesheet" href="https://ajax.googleapis.com/ajax/libs/jqueryui/1.9.1/themes/le-frog/jquery-ui.css" />');
        }
        check_jQuery_ui();
    }
}

function check_jQuery_ui () {
    if (typeof window.jQuery.ui == 'undefined') {
        window.setTimeout(check_jQuery_ui, 100);
    } else {
        go();
    }
}

if (typeof window.jQuery == 'undefined') {
    var script = document.createElement('script');
    script.type = "text/javascript";
    script.src = "https://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js";
    document.getElementsByTagName('head')[0].appendChild(script);
}

if (! window.injectDocsUIenabled ) {check_jQuery();}
