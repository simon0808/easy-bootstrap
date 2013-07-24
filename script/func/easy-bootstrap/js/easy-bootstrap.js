/*=====================================================================================
 * easy-bootstrap-treegrid v1.0
 * 
 * @author:zhouzy
 * @date:2013/06/24
 * @dependce:jquery bootstrap
 *=====================================================================================*/

!function($){
	
	"use strict";
	
	var TreeGrid = function (element, options) {
	    this.options = $.extend({}, $.fn.treegrid.defaults, options);
	    this.$element = $(element);
	    this.init();
	    var that = this;
	    this.mulSelectRow = [];
	    $(element).on('click', "tr[data-rowid]", function(e){that.trclickStyle(e);that.setSelected(e);})
	    		  .on('click', "tr[data-rowid] td i", function(e){that.fold(e);})
	    		  .on('click', "tr[data-rowid] td input[type='checkbox']", function(e){that.checkbox(e);})
	    		  .on('dblclick', "tr[data-rowid]", function(e){that.onDblClickRow(e);})
	    		  .on('click',"a[data-toolbar]",function(e){that.clickToolbar(e);});
	};
	
	TreeGrid.prototype = {
		init:function () {
			if(!this.options.columns){
				this.options.columns = (function findTableDef(that){
					var filedArr = "[";
					$("tr", that).each(function(){
						filedArr = filedArr + "[";
						$("th", this).each(function(){
							var data = $(this).data("options");
							data && (filedArr = filedArr + "{" + data + "},");
						});
						filedArr = filedArr + "],";
					});
					filedArr = filedArr + "]";
					filedArr = filedArr.replace(/\},\]/g, "}]").replace(/\],\]/g, "]]");
					return (new Function("return " + filedArr))();
				})(this.$element);
			}
			
			this.options.columns.length > 0
				&& this.getData()
				&& this.creatTable();
			this.$element.addClass(this.options.style);
		},
		
		reload:function(param){
			param && (this.options.param = param);
			this.options.selectedRow = null;
			this.init();
		},
		
		getData:function(){
			var tgrid = this
				,result = true;
			$.ajax({
				type: "get",
				url: this.options.url,
				success: function(data, textStatus){
					tgrid.options.rows = data.rows;
				},
				data:this.options.param,
				dataType:"JSON",
				async:false,
			});
			return result;
		},
		
		creatTable:function(){
			var table = "";				
			table += this.getTHead();
			table += this.getTBody();
			this.$element.html(table);
		},
		
		getTHead:function(){
			var thead = ""
				,op = this.options;
			
			op.title && (thead = thead + "<tr><th colspan='0' >" + op.title + "</th></tr>");
			
			op.toolbar && ((function toolbar(op){
				var tbHTML = "<tr><th colspan='0' >";
				$.each(op.toolbar,function(index,data){
					tbHTML = tbHTML + "<a href=\"javascript:void(0)\" data-toolbar=\"" + index + "\"><i class=\"" + this.iconCls + "\"></i>" + this.text + "</a>";
				});
				tbHTML = tbHTML + "</th></tr>";
				thead = thead + tbHTML;
			})(op));
			
			op.columns && ((function(op){
				$.each(op.columns,function(){
					thead = thead + "<tr>";
					op.rowNum && (thead = thead + "<th style=\"width:30px;\"></th>");
					$.each(this,function(){
						thead = thead + "<th";
						var thText = ""
							,thStyle = " style=\"";
						$.each(this,function(index,data){
							if(index == 'title'){
								thText = data; 
							}
							else{
								index == 'width' 
									? thStyle = thStyle + index + ":" + data + "%;"
									: thStyle = thStyle + index + ":" + data + ";";
							}
						});
						thead = thead + thStyle + "\">" + thText + "</th>";
					});
					thead = thead + "</tr>";
				});
			})(op));
			return thead;
		},
		
		getTBody:function(){
			var tr = ""
				,op = this.options
				,columns = []
				,rowNum = 1
				,paddingLeft = 14;
			$.each(op.columns,function(){
				$.each(this,function(){
					this.field && columns.push(this);
				});
			});
			!function eachTR(data,isShow,id){
				$.each(data,function(index,value){
					var that = this;
					id = id + 1;
					
					var checkbox = "";
					op.checkBox && (checkbox = "<input type=\"checkbox\"/>");
					this.check && (checkbox = "<input type=\"checkbox\" checked/>");
					
					var rowNumtd = "";
					op.rowNum && (rowNumtd = "<td>" + rowNum + "</td>");
					
					if(isShow=="show"){
						tr = tr + "<tr data-rowid=\"" + id + "\">" + checkbox + rowNumtd;
					}else{
						tr = tr + "<tr data-rowid=\"" + id + "\" style=\"display:none\">" + checkbox + rowNumtd;	
					}
					if(this.children && this.children.length > 0){
						$.each(columns,function(){
							var text = that[this.field];
							text || (text = "");
							var iconSty = that.state == "open" ? "icon-folder-open":"icon-folder-close";
							if(this.field == "text"){
								tr += "<td style=\"padding-left:" + paddingLeft + "px;\">";
								tr += checkbox;
								tr += "<i class=\""+iconSty+"\"></i>";
								tr += text + "</td>";
							}
							else{
								tr += "<td>" + text + "</td>";
							}
						});
						tr = tr + "</tr>";
						rowNum++;
						paddingLeft = paddingLeft + 14;
						this.state && this.state == "closed"
							? eachTR(this.children,"hide",id*1000)
							: eachTR(this.children,isShow,id*1000);
						
						paddingLeft = paddingLeft - 14;
					}
					else{
						$.each(columns,function(){
							var iconSty = "icon-file";
							that.state == "open" && (iconSty= "icon-folder-open");
							that.state == "closed" && (iconSty= "icon-folder-close");
							
							var text = that[this.field];
							text || (text = "");
							
							if(this.field == "text"){
								tr += "<td style=\"padding-left:" + paddingLeft + "px;\">";
								tr += checkbox;
								tr += "<i class=\""+iconSty+"\"></i>";
								tr += text + "</td>";
							}
							else{
								tr += "<td>" + text + "</td>";
							}
						});
						rowNum++;
						tr += "</tr>";
					}
				});
			}(op.rows,"show",0);
			return tr;
		},
		
		checkbox:function(e){
			var input = $(e.target)
				,op = this.options
				,tr = $(e.target).closest("tr")
				,rowid = tr.data('rowid')
				,row = this.getRowDataById(rowid)
				,isChecked = input.prop("checked");
			
			!function(data){
				data.check = isChecked;
				if(data.children && data.children.length > 0){
					!function ita(data){
						$.each(data,function(){
							this.check = isChecked;
							if(this.children && this.children.length > 0){
								ita(this.children);
							}
						});
					}(data.children);
				}
			}(row);
			
			this.creatTable();
		},
		
		fold:function(e){
			var op = this.options;
			var item = $(e.target).closest("tr")
				,rowid = item.data('rowid');
			op.selectedRow = this.getRowDataById(rowid);
			if(op.selectedRow.state == "open") {
				op.selectedRow.state = "closed";
			}else if(op.selectedRow.state == "closed"){
				op.selectedRow.state = "open";
				if(op.async && !op.selectedRow.children){
					var pa = {};
					$.each(op.selectedRow,function(index,data){index != "children" && (pa[index] = data);});
					op.selectedRow.childrenList || $.ajax({
						type: "get",
						url: op.asyncUrl,
						success: function(data, textStatus){
							op.selectedRow.children = data.rows;
						},
						data:pa,
						dataType:"JSON",
						async:false,
					});
				}
			}
			this.creatTable();
		},
		
		getMulSelected:function(){
			var mulSelectRow = []
				,that = this;
			$("tr[data-rowid] input[type='checkbox']",this.$element).each(function(){
				var $this = $(this)
					,item = $this.closest("tr")
					,rowid = item.data('rowid');
				$this.prop("checked") && mulSelectRow.push(that.getRowDataById(rowid));
			});
			return mulSelectRow;
		},
		
		getSelected:function(){
			return this.options.selectedRow;
		},
		
		setSelected:function(e){
			var item = $(e.target).closest("tr")
				,rowid = item.data('rowid');
			this.options.selectedRow = this.getRowDataById(rowid);
			if(this.options.onClick){
				this.options.onClick(this.options.selectedRow);
			}
		},
		
		getRowDataById:function(rowid){
			var op = this.options
				,rowdata = null;
			rowid = parseInt(rowid);
			
			!function getRow(data){
				var arr = [];
				while(rowid >= 1){
					var t = rowid%1000;
					arr.push(t);
					rowid = Math.floor(rowid/1000);
				}
				for(var i = arr.length - 1; i >= 0 ; i--){
					var k = arr[i] - 1;
					data[k]&&(rowdata = data[k])&&(data = data[k].children);
				}
			}(op.rows);
			return rowdata;
		},
		
		onDblClickRow:function(e){
			var tgrid = this;
			var item = $(e.target).closest("tr")
				,rowid = item.data('rowid')
				,i = 1;
			tgrid.options.selectedRow = this.getRowDataById(rowid);
			
			if(tgrid.options.onDblClickRow){
				tgrid.options.onDblClickRow(tgrid.options.selectedRow);
			}
		},
		
		clickToolbar:function(e){
			var toolbar = $(e.target)
				,index = toolbar.data('toolbar');
			this.options.toolbar[index].handler();
		},
		
		trclickStyle:function(e){
			$("tr",this.$element).each(function(){
				var $this = $(this);
				$this.removeClass("treegridtrclick");
			});
			var item = $(e.target).closest("tr");
			$(item).addClass("treegridtrclick");
		}
	};
	
	$.fn.treegrid = function (option,param) {
		var result = null;
	    var tgrid = this.each(function () {
	    	var $this = $(this)
	        	, data = $this.data('treegrid')
	        	, options = typeof option == 'object' && option;
	    	if(typeof option == 'string' ){
	    		result = data[option](param);
	    	}else{
	    		$this.data('treegrid', (data = new TreeGrid(this, options)));
	    	}
	    });
	    if(typeof option == 'string')return result;
	    return tgrid;
	};
	
	$.fn.treegrid.defaults = {
		url:"",
		title:null,
		toolbar:null,
		param:null,
		columns:null,
		rows:[],
		selectedRow:null,
		onDblClickRow:null,
		rowNum:true,
		style:"table table-bordered table-hover",
		async:false,
		asyncUrl:"",
		onClick:null,
		checkBox:false,
	};
	
	$(window).on('load', function(){
			$("table[class='treegrid.html']").each(function () {
			var $tgrid = $(this)
			, data = $tgrid.data('options');
			if(!data) return;
			$tgrid.treegrid((new Function("return {" + data + "}"))());
		});
	});
	
}(window.jQuery);

/*=====================================================================================
 * easy-bootstrap-tree v1.0
 * 
 * @author:zhouzy
 * @date:2013/06/28
 * @dependce:jquery bootstrap
 *=====================================================================================*/
!function($){
	
	"use strict";
	
	var Tree = function (element, options) {
	    this.options = $.extend({}, $.fn.tree.defaults, options);
	    this.$element = $(element);
	    this.init();
	    var that = this;
	    $(element).on('click', "span[data-nodeid]", function(e){that.setSelected(e);return false;})
	    		  .on('click', "span[data-nodeid] i", function(e){that.fold(e);return false;})
	    	      .on('dblclick', "span[data-nodeid]", function(e){that.onDblClickRow(e);return false;})
	    		  .on('click',"a[data-toolbar]",function(e){that.clickToolbar(e);return false;});
	};
	
	Tree.prototype = {
		init:function () {
			this.getData();
			this.creatTree();
			$(this.$element).addClass("tree");
			$("ul",this.$element).addClass(this.options.style);
		},
		reload:function(param){
			param && (this.options.param = param);
			this.init();
		},
		fold:function(e){
			var op = this.options
				,item = $(e.target).closest("span")
				,id = item.data('nodeid');
			this.getDataById(id);
		
			if(op.selectedRow.state == "open") {
				op.selectedRow.state = "closed";
			}
			else if(op.selectedRow.state == "closed"){
				op.selectedRow.state = "open";
				if(op.async){
					var pa = {};
					$.each(op.selectedRow,function(index,data){index != "childrenList" && (pa[index] = data);});
					op.selectedRow.childrenList || $.ajax({
						type: "get",
						url: op.asyncUrl,
						success: function(data, textStatus){
							op.selectedRow.childrenList = data.rows;
						},
						data:pa,
						dataType:"JSON",
						async:false,
					});
				}
			}
			this.creatTree();
		},
		getData:function(){
			var tree = this;
			$.ajax({
				type: "get",
				url: this.options.url,
				success:function(data, textStatus){
					tree.options.rows = data.rows;
				},
				data:this.options.param,
				dataType:"JSON",
				async:false,
			});
			return true;
		},
		creatTree:function(){
			var html = ""
				,rownum = 0
				,level = 0
				,op = this.options;
			if(op.toolbar){
				var tbHTML = "<div class=\"toolbar\">";
				$.each(op.toolbar,function(index,data){
					tbHTML = tbHTML + "<a href=\"javascript:void(0)\" data-toolbar=\"" + index + "\"><i class=\"" + this.iconCls + "\"></i>" + this.text + "</a>";
				});
				tbHTML = tbHTML + "</div>";
				html = html + tbHTML;
			}
			!function creatUL(data,isShow,id){
				$.each(data,function(index,value){
					id = id + 1;
					if(isShow=="show"){
						html = html + "<ul style=\"margin:0px\">";
					}else{
						html = html + "<ul style=\"margin:0px;display:none\">";
					}
					var that = this;
					rownum ++ ;
					if(this.children && this.children.length > 0){
						var iconSty = that.state == "open" ? "icon-folder-open":"icon-folder-close";
						html += "<li>"; 
						html +=	"<span data-nodeid=\""+  (id) + "\" style=\"padding-left:" + level*14+ "px;display:inline-block;\">";
						html += "<i class=\""+ iconSty +"\"></i>";
						html += this.text + "</span>";
						level++;
						this.state && this.state == "closed"
							? creatUL(this.children,"hide",id*10)
							: creatUL(this.children,isShow,id*10);
						level--;
						html = html + "</li>";
					}
					else{
						html += "<li>"; 
						html +=	"<span data-nodeid=\""+  (id) + "\" style=\"padding-left:" + level*14+ "px;display:inline-block;\">";
						html += "<i class=\"icon-file\"></i>";
						html += this.text + "</span></li>";
					}
					html = html + "</ul>";
				});
			}(op.rows,"show",0);
			
			this.$element.html(html);
		},
		getSelected:function(){
			return this.options.selectedRow;
		},
		setSelected:function(e){
			var tree = this;
			var item = $(e.target).closest("span")
				,id = item.data('nodeid');
			this.getDataById(id);
			if(tree.options.onClickRow){
				tree.options.onClickRow(tree.options.selectedRow);
			}
		},
		onDblClickRow:function(e){
			var tree = this;
			var item = $(e.target).closest("span")
				,id = item.data('nodeid');
			
			this.getDataById(id);
			
			if(tree.options.onDblClickRow){
				tree.options.onDblClickRow(tree.options.selectedRow);
			}
			return false;
		},
		clickToolbar:function(e){
			var toolbar = $(e.target)
				,index = toolbar.data('toolbar');
			this.options.toolbar[index].handler();
		},
		getDataById:function(id){
			var op = this.options;
			if(id){
				(id = id.toString());
				!function getRow(data){
					var arr = id.split("");
					for(var i=0,j=id.length; i<j; i++){
						var k = parseInt(arr[i]) - 1;
						data[k] && (op.selectedRow = data[k]) && (data = data[k].children);
					}
				}(op.rows);
			}
		},
	};
	
	$.fn.tree = function (option,param) {
		var result = null;
	    var tree = this.each(function () {
	    	var $this = $(this)
	        	, data = $this.data('tree')
	        	, options = typeof option == 'object' && option;
	    	typeof option == 'string' 
	    		? result = data[option](param)
	    		: $this.data('tree', (data = new Tree(this, options)));
	    });
	    if(typeof option == 'string')return result;
	    return tree;
	};
	
	$.fn.tree.defaults = {
		url:"",
		title:null,
		param:null,
		rows:[],
		selectedRow:null,
		onDblClickRow:null,
		style:"nav nav-tabs nav-stacked",
		page:true,
		async:false,
		asyncUrl:null,
	};
	
	$(window).on('load', function(){
			$("[class='tree']").each(function () {
			var $tree = $(this)
			, data = $tree.data('options');
			if(!data) return;
			$tree.tree((new Function("return " + data))());
		});
	});
	
}(window.jQuery);

!function($){
	//初始化下拉框触发组件
	var selectArray = {};
	//对validtype的处理，目前只有一个case 为 num-only
	$.fn.selectValidtype = function(validtype){
		if(!isArray(validtype)){
			validtype = validtype.split(",");
		}
		var obj = $(this);
		var id = obj.attr("id");
		for(var i=0;i<validtype.length;i++){
			switch(validtype[i]){
				case "num-only":
					alert("select框不需要加入num-only属性");
					break;
				case "required":
					obj.addClass("required");
					break;
			}
		}
	}
	var valueToText = {};
	$.fn.initSelect = function(){
		var thisObj = $(this).get(0);
		var nameAttr = $(this).attr("name");
		var name = $(this).html();
		$(this).clearSelect();
		var toggle_html = "";
		toggle_html = toggle_html + '<span class="add-on search-name" style="height:16px">'+name+'</span>';
		if($(this).parent().attr("class")=="search-keyword-area"){
			toggle_html = toggle_html + '<span class="search-select value-displayer" name="'+nameAttr+'" ></span>';
		}else{
			toggle_html = toggle_html + '<span class="tan-chu-kuang-select value-displayer" name="'+nameAttr+'" ></span>';
		}
		toggle_html = toggle_html + '<div class="btn btn-small"><span class="caret"></span></div>';
		$(this).addClass("input-prepend").addClass("input-append").addClass("dropdown").html(toggle_html);
		if($(this).parent().attr("class")=="search-keyword-area"){
			$(this).addClass("search-input-group");
		}else{
			$(this).addClass("tan-chu-kuang-input-group");
		}
		var attrArray = ["name","value","text","data-options"];
		var valueDisplayer = $(thisObj).children(".search-select,.tan-chu-kuang-select").get(0);
		for(var i=0;i<attrArray.length;i++){
			$(valueDisplayer).attr(attrArray[i],$(thisObj).attr(attrArray[i]));
		}
		thisObj = $(thisObj).children(".search-select,.tan-chu-kuang-select");
		if(thisObj.attr("data-options")){
			var dataOptionsStr = thisObj.attr("data-options");
			dataOptions = dataOptionsHandler(dataOptionsStr);
			//alert(dataOptions.defaultVal);
			var selectIndex = thisObj.attr("name");
			
			if(selectArray[selectIndex]){
				for(var index in dataOptions){
					if(!selectArray[selectIndex].dataOptions[index]){
						selectArray[selectIndex].dataOptions[index] = dataOptions[index];
					}
				}
			}else{
				selectArray[selectIndex] = new Select();
				selectArray[selectIndex].dataOptions = dataOptions;
			}
			
			if(selectArray[selectIndex]){
				if(selectArray[selectIndex].dataOptions.defaultVal){
					//alert(selectArray[selectIndex].dataOptions.defaultVal);
					var id = thisObj.attr("id");
					$("#"+id).attr("value",selectArray[selectIndex].dataOptions.defaultVal);
				}
				if(selectArray[selectIndex].dataOptions.validtype){
					thisObj.selectValidtype(selectArray[selectIndex].dataOptions.validtype);
				}
			}
		}
		return $(this);
	};
	//多选下拉框组件
	$.fn.initMultipleSelectByHtml = function(){
		var obj = $(this);
		var id = obj.attr("id");
		var nameText = obj.attr("text");
		obj.wrap(document.createElement("div"));
		var parent = $(this).parent();
		var attrArray = ["id","name","value","text","data-options","class"];
		for(var i=0;i<attrArray.length;i++){
			parent.attr(attrArray[i],obj.attr(attrArray[i]));
		}
		var optionArray;
		obj.each(function(){
			optionArray = $(this).children();
		});
		var option = optionArray.first();
		var array = [];
		for(var i = 0;i<optionArray.length;i++){
			if(option.attr("class")=="divider"){
				array[i] = "divider";
			}else{
				array[i] = {};
				array[i].text = option.html();
				array[i].value = option.attr("value");
			}
			option = option.next();
		}
		parent.html(nameText);
		$("#"+id).initMultipleSelect(array);
		return $(this);
	}
	$.fn.initMultipleSelect = function(array){
		$(this).initSelect();
		var id = $(this).attr("id");
		valueToText[id] = {}
		for(var i=0;i<array.length;i++){
			valueToText[id][array[i].value] = array[i].text;
		}
		var length = array.length;
		var index = $(this).attr("id").split("_")[1];
		var dropdown_menu_id = "dropdown-menu_"+index;
		var options_html = "";
		if($(this).parent().attr("class")=="search-keyword-area"){
			options_html = options_html + '<ul class="dropdown-menu dropdown-menu-multiple input-prepend input-append index-dropdown-menu" role="menu"  aria-labelledby="dLabel" id="dropdown-menu_'+index+'">';
		}else{
			options_html = options_html + '<ul class="dropdown-menu dropdown-menu-multiple input-prepend input-append tan-chu-kuang-dropdown-menu" role="menu"  aria-labelledby="dLabel" id="dropdown-menu_'+index+'">';
		}
		for(var i=0;i<length;i++){
			if(array[i]=="divider"){
				options_html = options_html + '<li class="divider"></li>';
			}else{
				options_html = options_html + '<li><a tabindex="-treegrid.html" href="#" class="multiple-select-option"><input type="checkbox" value="'+array[i].value+'"  id="'+array[i].text+'"/><label for="'+array[i].text+'"> '+array[i].text+'</label></a></li>';
			}
		}
		options_html = options_html + '<li class="divider"></li>';
		options_html = options_html + '<li><div class="btn btn-mini btn-success dropdown-menu-multiple-button">确定</div><div class="btn btn-mini btn-danger dropdown-menu-multiple-button">取消</div></li>';
		options_html = options_html + '</ul>';
		$("#dropdown-menu_"+index).remove();
		if($(".slideDown-window-in-index").length == 0){
			$(body).prepend('<div class="slideDown-window-in-index" id="slideDown-window-in-index-01"></div>');	
		}
		$(".slideDown-window-in-index").append(options_html);
		var width = 49;
		width = $("#"+id).find(".search-name").width()+$("#"+id).find(".value-displayer").width()+$("#"+id).find(".btn").width()+39;
		$(".slideDown-window-in-index").find("#dropdown-menu_"+index).css("width",width);
		return $(this);
	}
	$.fn.addMultipleSelectOptions = function(array){
		var id = $(this).attr("id");
		for(var i=0;i<array.length;i++){
			valueToText[id][array[i].value] = array[i].text;
		}
		var length = array.length;
		var index = $(this).attr("id").split("_")[1];
		var dropdown_menu_id = "dropdown-menu_"+index;
		var options_html = "";
		if($(this).parent().attr("class")=="search-keyword-area"){
			options_html = options_html + '<ul class="dropdown-menu dropdown-menu-multiple input-prepend input-append index-dropdown-menu" role="menu"  aria-labelledby="dLabel" id="dropdown-menu_'+index+'">';
		}else{
			options_html = options_html + '<ul class="dropdown-menu dropdown-menu-multiple input-prepend input-append tan-chu-kuang-dropdown-menu" role="menu"  aria-labelledby="dLabel" id="dropdown-menu_'+index+'">';
		}
		var oldHtml = "";
		oldHtml = $("#dropdown-menu_"+index).html();
		if(oldHtml){
			oldHtml = oldHtml.split('<li class="divider"></li><li><div class="btn btn-mini btn-success dropdown-menu-multiple-button">确定</div><div class="btn btn-mini btn-danger dropdown-menu-multiple-button">取消</div></li>')[0];
			options_html = options_html + oldHtml;
		}
		for(var i=0;i<length;i++){
			if(array[i]=="divider"){
				options_html = options_html + '<li class="divider"></li>';
			}else{
				options_html = options_html + '<li><a tabindex="-treegrid.html" href="#" class="multiple-select-option"><input type="checkbox" value="'+array[i].value+'"  id="'+array[i].text+'"/><label for="'+array[i].text+'"> '+array[i].text+'</label></a></li>';
			}
		}
		options_html = options_html + '<li class="divider"></li>';
		options_html = options_html + '<li><div class="btn btn-mini btn-success dropdown-menu-multiple-button">确定</div><div class="btn btn-mini btn-danger dropdown-menu-multiple-button">取消</div></li>';
		options_html = options_html + '</ul>';
		$("#dropdown-menu_"+index).remove();
		$(".slideDown-window-in-index").append(options_html);
		var width = 49;
		width = $("#"+id).find(".search-name").width()+$("#"+id).find(".value-displayer").width()+$("#"+id).find(".btn").width()+39;
		$(".slideDown-window-in-index").find("#dropdown-menu_"+index).css("width",width);
		return $(this);
	};
	$.fn.addMultipleSelectOption = function(text,value){
		var array = [{"text":text,"value":value}];
		$(this).addMultipleSelectOptions(array);
		return $(this);
	}
	//单选下拉框组件
	$.fn.initSingleSelectByHtml = function(){
		var obj = $(this);
		var id = obj.attr("id");
		var nameText = obj.attr("text");
		obj.wrap(document.createElement("div"));
		var parent = $(this).parent();
		var attrArray = ["id","name","value","text","data-options","class"];
		for(var i=0;i<attrArray.length;i++){
			parent.attr(attrArray[i],obj.attr(attrArray[i]));
		}
		var optionArray;
		obj.each(function(){
			optionArray = $(this).children();
		});
		var option = optionArray.first();
		var array = [];
		for(var i = 0;i<optionArray.length;i++){
			if(option.attr("class")=="divider"){
				array[i] = "divider";
			}else{
				array[i] = {};
				array[i].text = option.html();
				array[i].value = option.attr("value");
			}
			option = option.next();
		}
		parent.html(nameText);
		$("#"+id).initSingleSelect(array);
		return $(this);
	}
	$.fn.initSingleSelect = function(array){
		$(this).initSelect();
		var id = $(this).attr("id");
		valueToText[id] = {};
		for(var i=0;i<array.length;i++){
			valueToText[id][array[i].value] = array[i].text;
		}
		var length = array.length;
		var index = $(this).attr("id").split("_")[1];
		var options_html = "";
		if($(this).parent().attr("class")=="search-keyword-area"){
			options_html = options_html + '<ul class="dropdown-menu input-prepend input-append index-dropdown-menu" role="menu"  aria-labelledby="dLabel" id="dropdown-menu_'+index+'">';
		}else{
			options_html = options_html + '<ul class="dropdown-menu input-prepend input-append tan-chu-kuang-dropdown-menu" role="menu"  aria-labelledby="dLabel" id="dropdown-menu_'+index+'">';
		}
		for(var i=0;i<length;i++){
			if(array[i]=="divider"){
				options_html = options_html + '<li class="divider"></li>';
			}else{
				options_html = options_html + '<li><a tabindex="-treegrid.html" href="#" class="single-select-option" value="'+array[i].value+'">'+array[i].text+'</a></li>';
			}
		}
		options_html = options_html + '</ul>';
		$(".slideDown-window-in-index").append(options_html);
		var width = 49;
		width = $("#"+id).find(".search-name").width()+$("#"+id).find(".value-displayer").width()+$("#"+id).find(".btn").width()+39;
		$(".slideDown-window-in-index").find("#dropdown-menu_"+index).css("width",width);
		return $(this);
	}
	$.fn.addSingleSelectOptions = function(array){
		var id = $(this).attr("id");
		for(var i=0;i<array.length;i++){
			valueToText[id][array[i].value] = array[i].text;
		}
		var length = array.length;
		var index = $(this).attr("id").split("_")[1];
		var options_html = "";
		if($(this).parent().attr("class")=="search-keyword-area"){
			options_html = options_html + '<ul class="dropdown-menu input-prepend input-append index-dropdown-menu" role="menu"  aria-labelledby="dLabel" id="dropdown-menu_'+index+'">';
		}else{
			options_html = options_html + '<ul class="dropdown-menu input-prepend input-append tan-chu-kuang-dropdown-menu" role="menu"  aria-labelledby="dLabel" id="dropdown-menu_'+index+'">';
		}
		var oldHtml = "";
		oldHtml = $("#dropdown-menu_"+index).html();
		if(oldHtml){
			options_html = options_html + oldHtml;
		}
		for(var i=0;i<length;i++){
			if(array[i]=="divider"){
				options_html = options_html + '<li class="divider"></li>';
			}else{
				options_html = options_html + '<li><a tabindex="-treegrid.html" href="#" class="single-select-option" value="'+array[i].value+'">'+array[i].text+'</a></li>';
			}
		}
		options_html = options_html + '</ul>';
		$("#dropdown-menu_"+index).remove();
		$(".slideDown-window-in-index").append(options_html);
		var width = 49;
		width = $("#"+id).find(".search-name").width()+$("#"+id).find(".value-displayer").width()+$("#"+id).find(".btn").width()+39;
		$(".slideDown-window-in-index").find("#dropdown-menu_"+index).css("width",width);
		$("#dropdown-menu_"+index).setDropdown();
		var selectIndex = $("#"+id).find(".search-name").attr("name");
		if(selectArray[selectIndex] && selectArray[selectIndex].dataOptions && selectArray[selectIndex].dataOptions.selectHandler && $(thisObj).parent().attr("class").indexOf("single-select")>=0){
			var func = selectArray[selectIndex].dataOptions.selectHandler;
			if(typeof func == "string")
				func = window[func];
			var dropdownMenuId = "dropdown-menu_"+index;
			$("#"+dropdownMenuId).find("a").each(function(){
				$(this).get(0).onclick = func;
			});
		}
		return $(this);
	};
	$.fn.addSingleSelectOption = function(text,value){
		var array = [{"text":text,"value":value}];
		$(this).addSingleSelectOptions(array);
		return $(this);
	}
	//清空下拉框组件
	$.fn.clearSelect = function(){
		var index = $(this).attr("id").split("_")[1];
		$("#dropdown-menu_"+index).remove();
		return $(this);
	};



	//初始化单选框
	$(".single-select").each(function(){
		$(this).initSingleSelectByHtml();
	});
	//初始化多选框
	$(".multiple-select").each(function(){
		$(this).initMultipleSelectByHtml();
	});
	
	function Select(){
		this.dataOptions = {};
	}



	$.fn.setSelectAttr = function(param1,param2){
		var returnValue = null;
		var thisObject = $(this).get(0);
		var parent = $(this).parent(".dropdown");
		var children = $(this).children(".search-select,.tan-chu-kuang-select,.search-name,.btn");
		var arr = [$(thisObject)];
		if(parent.length > 0){
			arr.push(parent);
		}
		if(children.length > 0){
			children.each(function(){
				var obj = $(this);
				arr.push(obj);
			});
		}
		$(thisObject).each(function(){
			var thisObj;
			var thisCls = $(this).attr("class");
			if(thisCls.indexOf("search-select")>=0 || thisCls.indexOf("tan-chu-kuang-select")>=0){
				thisObj = $(this).get(0);
			}else if(thisCls.indexOf("search-name")>=0){
				thisObj = $(this).next().get(0);
			}else if(thisCls.indexOf("btn-small") >=0){
				thisObj = $(this).prev().get(0);
			}else if(thisCls.indexOf("drop")>=0){
				thisObj = $(this).children(".search-select,.tan-chu-kuang-select").get(0);
			}
			var thisId = $(thisObj).attr("id");
			var selectIndex = $(thisObj).attr("name");
			selectArray[selectIndex] = new Select();
			if(param1){
				if(isObject(param1)){
					selectArray[selectIndex].dataOptions = param1;
				}
			}
			if($(thisObj).attr("data-options")){
				var dataOptions = dataOptionsHandler($(thisObj).attr("data-options"));
				for(var index in dataOptions){
					if(selectArray[selectIndex]){
						if(!selectArray[selectIndex].dataOptions[index]){
							selectArray[selectIndex].dataOptions[index] = dataOptions[index];
						}
					}
				}
			}
			//alert(selectArray[selectIndex].dataOptions.defaultVal);
			if(param1){
				var timeoutMS = 250;
				if(param1.timeoutMS){
					var timeoutMS = param1.timeoutMS;
				}
				var onclickTimeout;
				var lastClick = 0;
				var thisClick = 0;
				var onmousedownTimeout;
				var lastMousedown = 0;
				var thisMousedown = 0;
				var onmouseupTimeout;
				var lastMouseup = 0;
				var thisMouseup = 0;
				if(param1.clickHandler){
					thisObj.parentNode.onclick = function(){
						var d = new Date();
						lastClick = thisClick;
						thisClick = d.getTime();
						if((thisClick - lastClick) > timeoutMS){
							onclickTimeout = setTimeout(param1.clickHandler,timeoutMS);
						}
					};
				}
				if(param1.mouseoverHandler){
					var fun = param1.mouseoverHandler;
					thisObj.parentNode.onmouseover = fun;
				}
				if(param1.mouseoutHandler){
					var fun = param1.mouseoutHandler;
					thisObj.parentNode.onmouseout = fun;
				}
				if(param1.mousedownHandler){
					thisObj.parentNode.onmousedown = function(){
						var d = new Date();
						lastMousedown = thisMousedown;
						thisMousedown = d.getTime();
						if((thisMousedown - lastMousedown) > timeoutMS){
							onmousedownTimeout = setTimeout(param1.mousedownHandler,timeoutMS);
						}else{
							clearTimeout(onmousedownTimeout);
						}
					};
				}
				if(param1.mouseupHandler){
					thisObj.parentNode.onmouseup = function(){
						var d = new Date();
						lastMouseup = thisMouseup;
						thisMouseup = d.getTime();
						if((thisMouseup - lastMouseup) > timeoutMS){
							onmouseupTimeout = setTimeout(param1.mouseupHandler,timeoutMS);
						}else{
							clearTimeout(onmouseupTimeout);
						}
					};
				}
				if(param1.dblclickHandler){
					thisObj.parentNode.ondblclick = function(){
						clearTimeout(onclickTimeout);
						clearTimeout(onmousedownTimeout);
						clearTimeout(onmouseupTimeout);
						param1.dblclickHandler();
					};
				}
				if(param1.changeHandler){
					var fun = param1.changeHandler;
					thisObj.parentNode.onchange = fun; 
				}
				if(param1.keydownHandler){
					var fun = param1.keydown;
					thisObj.parentNode.onkeydown = fun;
				}
				if(param1.keyupHandler){
					var fun = param1.keyup;
					thisObj.parentNode.onkeyup = fun;
				}
				if(param1.keypressHandler){
					var fun = param1.keypressHandler;
					thisObj.parentNode.onkeypress = fun;
				}
			
				//getvalue方法
				if(param1 == "getvalue"){
					returnValue = $(thisObj).attr("value");
				}
				//setvalue方法
				if(param1 == "setvalue"){
					var value = param2;
					$(thisObj).attr("value",value);
					var id = $(thisObj).parent().attr("id");
					if(value.indexOf(",")>=0){
						var valueArr = value.split(",");
						var text ;
						if(valueToText[id][valueArr[0]]){
							text = valueToText[id][valueArr[0]];
						}else{
							text = valueArr[0];
						}
						for(var i=1;i<valueArr.length;i++){
							text = text + ",";
							if(valueToText[id][valueArr[i]]){
								text = text + valueToText[id][valueArr[i]];
								alert("treegrid.html"+text);
							}else{
								text = text + valueArr[i];
								alert("2"+text);
							}
						}
						$(thisObj).html(text);
					}else{
						if(valueToText[id][value]){
							$(thisObj).html(valueToText[id][value]);
						}else{
							$(thisObj).html(value);
						}
					}
				}
				//clear方法
				if(param1 == "clear"){
					$(thisObj).attr("value","");
					$(thisObj).html("");
				}
			}
			//defaultvalue属性
			if(selectArray[selectIndex].dataOptions){
				if(selectArray[selectIndex].dataOptions.defaultVal && $(thisObj).attr("class").indexOf("inited")<=0){
					var text = "";
					var value = selectArray[selectIndex].dataOptions.defaultVal;
					$(thisObj).attr("value",selectArray[selectIndex].dataOptions.defaultVal);
					var id = $(thisObj).parent().attr("id");
					if(value.indexOf(",")>=0){
						var valueArr = value.split(",");
						var text ;
						if(valueToText[id][valueArr[0]]){
							text = valueToText[id][valueArr[0]];
						}else{
							text = valueArr[0];
						}
						for(var i=1;i<valueArr.length;i++){
							text = text + ",";
							if(valueToText[id][valueArr[i]]){
								text = text + valueToText[id][valueArr[i]];
							}else{
								text = text + valueArr[i];
							}
						}
						$(thisObj).html(text);
					}else{
						if(valueToText[id][value]){
							$(thisObj).html(valueToText[id][value]);
						}else{
							$(thisObj).html(value);
						}
					}
				}
			}
			//validtype属性,目前只有 num-only 有效
			if(selectArray[selectIndex].dataOptions){
				if(selectArray[selectIndex].dataOptions.validtype){
					$(thisObj).selectValidtype(selectArray[selectIndex].dataOptions.validtype);
				}
			}
			//单选框选中时触发的事件
			if(selectArray[selectIndex].dataOptions && selectArray[selectIndex].dataOptions.selectHandler && $(thisObj).parent().attr("class").indexOf("single-select")>=0){
				var func = selectArray[selectIndex].dataOptions.selectHandler;
				if(typeof func == "string")
					func = window[func];
				var index = $(thisObj).parent().attr("id").split("_")[1];
				var dropdownMenuId = "dropdown-menu_"+index;
				$("#"+dropdownMenuId).find("a").each(function(){
					$(this).get(0).onclick = func;
				});
			}
			$(thisObj).addClass("inited");
		});
		return returnValue;
	}

	
	// 将元素中的 data-options 转换成 dataOptions 对象
	function dataOptionsHandler(str){
		var dataOptionsStr = str;
		var dataOptionsStrArray = dataOptionsStr.split(":");
		var dataOptions = {};
		for(var i=1;i<dataOptionsStrArray.length;i++){
			var j = i-1;
			var preArray = dataOptionsStrArray[j].split(",");
			var index = preArray[preArray.length-1].split("'")[0].split('"')[0];
			var thisArray = dataOptionsStrArray[i].split(",");
			if(i<dataOptionsStrArray.length-1){
				thisArray.pop();
			}
			for(var m=0;m<thisArray.length;m++){
				if(m==0){
					if(thisArray[m].indexOf("'")>=0){
						var strArray = thisArray[m].split("'");
						var str = strArray[1];
						thisArray[m] = str;
					}else if(thisArray[m].indexOf('"')>=0){
						var strArray = thisArray[m].split('"');
						var str = strArray[1];
						thisArray[m] = str;
					}
				}else{
					thisArray[m] = thisArray[m].split("'")[0].split('"')[0];
				}
			}
			var value = thisArray;
			if(value.length == 1 && index != "validtype"){
				value = value[0];
			}
			dataOptions[index] = value;
		}
		return dataOptions;
	}
	//判断变量是否是数组
	function isArray (array)
	{
		
		if ( array.constructor == window.Array )
		{
			return true;
		}
		else
		{
			return false;
		}
	}
	//判断目标参数是否为Object对象
	var isObject = function (source) {
		return 'function' == typeof source || !!(source && 'object' == typeof source);
	};
}(window.jQuery);



!function($){
	//初始化只读输入框
		var readonlyInputArray = {};
		//对validtype的处理，目前只有一个case 为 num-only
		$.fn.readonlyInputValidtype = function(validtype){
			if(!isArray(validtype)){
				validtype = validtype.split(",");
			}
			var obj = $(this);
			var id = obj.attr("id");
			for(var i=0;i<validtype.length;i++){
				switch(validtype[i]){
					case "num-only":
						alert("read-only为只读输入框，不需要加入num-only属性");
						break;
					case "required":
						obj.addClass("required");
						break;
				}
			}
		}
		$(".read-only").each(function(){
			var thisObj = $(this);
			var parent = thisObj.parent();
			var parentCls = parent.attr("class");
			if(thisObj.attr("data-options")){
				var dataOptionsStr = thisObj.attr("data-options");
				dataOptions = dataOptionsHandler(dataOptionsStr);
				var readonlyInputIndex = thisObj.attr("name");
				
				if(readonlyInputArray[readonlyInputIndex]){
					for(var index in dataOptions){
						if(!readonlyInputArray[readonlyInputIndex].dataOptions[index]){
							readonlyInputArray[readonlyInputIndex].dataOptions[index] = dataOptions[index];
						}
					}
				}else{
					readonlyInputArray[readonlyInputIndex] = new ReadonlyInput();
					readonlyInputArray[readonlyInputIndex].dataOptions = dataOptions;
				}
				
				if(readonlyInputArray[readonlyInputIndex]){
					if(readonlyInputArray[readonlyInputIndex].dataOptions.defaultVal){
						//alert(normalInputArray[normalInputIndex].dataOptions.defaultVal);
						var id = thisObj.attr("id");
						$("#"+id).attr("value",readonlyInputArray[readonlyInputIndex].dataOptions.defaultVal);
						$("#"+id).html(readonlyInputArray[readonlyInputIndex].dataOptions.defaultVal);
					}
					if(readonlyInputArray[readonlyInputIndex].dataOptions.validtype){
						thisObj.readonlyInputValidtype(readonlyInputArray[readonlyInputIndex].dataOptions.validtype);
					}
				}
			}
			if(parentCls == "search-keyword-area"){
				thisObj.wrap(document.createElement("div"));
				var parent = thisObj.parent();
				parent.addClass("input-prepend").addClass("search-input-group");
				var thisCls = thisObj.attr("class");
				var thisId = thisObj.attr("id");
				var thisName = thisObj.attr("name");
				var thisValue = thisObj.attr("value");
				var thisText = thisObj.attr("text");
				var data_options = thisObj.attr("data-options");
				var html = "";
				html = html + '<span class="add-on search-name">'+thisText+'</span>';
				html = html + '<span class="search-input uneditable-input value-displayer '+thisCls+'" name="'+thisName+'" id="'+thisId+'" value="'+thisValue+'" data-options="'+data_options+'" >'+thisValue+'</span>';
				parent.html(html);
				thisObj = parent.find(".value-displayer");
				if(readonlyInputArray[readonlyInputIndex] && readonlyInputArray[readonlyInputIndex].dataOptions && readonlyInputArray[readonlyInputIndex].dataOptions.button){
					var btnText = "";
					if(readonlyInputArray[readonlyInputIndex].dataOptions.button.text)
						btnText = readonlyInputArray[readonlyInputIndex].dataOptions.button.text;
					thisObj.after('<div class="btn btn-small add-on input-group-button">'+btnText+'</div>');
					parent.addClass("input-append");
					thisObj.css("width",140-thisObj.next().width());
				}
			}else{
				thisObj.wrap(document.createElement("div"));
				var parent = thisObj.parent();
				parent.addClass("input-prepend").addClass("tan-chu-kuang-input-group");
				var thisCls = thisObj.attr("class");
				var thisId = thisObj.attr("id");
				var thisName = thisObj.attr("name");
				var thisValue = thisObj.attr("value");
				var thisText = thisObj.attr("text");
				var data_options = thisObj.attr("data-options");
				var html = "";
				html = html + '<span class="add-on search-name">'+thisText+'</span>';
				html = html + '<span class="tan-chu-kuang-input uneditable-input value-displayer '+thisCls+'" name="'+thisName+'" id="'+thisId+'" value="'+thisValue+'" data-options="'+data_options+'" >'+thisValue+'</span>';
				parent.html(html);
				thisObj = parent.find(".value-displayer");
				if(readonlyInputArray[readonlyInputIndex] && readonlyInputArray[readonlyInputIndex].dataOptions && readonlyInputArray[readonlyInputIndex].dataOptions.button){
					var btnText = "";
					if(typeof readonlyInputArray[readonlyInputIndex].dataOptions.button == "string")
						readonlyInputArray[readonlyInputIndex].dataOptions.button = window[readonlyInputArray[readonlyInputIndex].dataOptions.button];
					if(readonlyInputArray[readonlyInputIndex].dataOptions.button.text)
						btnText = readonlyInputArray[readonlyInputIndex].dataOptions.button.text;
					thisObj.after('<div class="btn btn-small add-on input-group-button">'+btnText+'</div>');
					parent.addClass("input-append");
				}
			}
			
		});
		function ReadonlyInput(){
			this.dataOptions = {};
		}

		$.fn.setReadonlyInputAttr = function(param1,param2){
			var returnValue = $(this);
			$(this).each(function(){
				var thisId = $(this).attr("id");
				var thisObj = $(this).get(0);
				var readonlyInputIndex = $(thisObj).attr("name");
				readonlyInputArray[readonlyInputIndex] = new ReadonlyInput();
				if(param1){
					if(isObject(param1)){
						readonlyInputArray[readonlyInputIndex].dataOptions = param1;
					}
				}
				if($(thisObj).attr("data-options")){
					var dataOptions = dataOptionsHandler($(thisObj).attr("data-options"));
					for(var index in dataOptions){
						if(readonlyInputArray[readonlyInputIndex]){
							if(!readonlyInputArray[readonlyInputIndex].dataOptions[index]){
								readonlyInputArray[readonlyInputIndex].dataOptions[index] = dataOptions[index];
							}
						}
					}
				}
				//绑定各种事件
				if(param1){
					var timeoutMS = 250;
					if(param1.timeoutMS){
						var timeoutMS = param1.timeoutMS;
					}
					var onclickTimeout;
					var lastClick = 0;
					var thisClick = 0;
					var onmousedownTimeout;
					var lastMousedown = 0;
					var thisMousedown = 0;
					var onmouseupTimeout;
					var lastMouseup = 0;
					var thisMouseup = 0;
					if(param1.clickHandler){
						thisObj.onclick = function(){
							var d = new Date();
							lastClick = thisClick;
							thisClick = d.getTime();
							if((thisClick - lastClick) > timeoutMS){
								onclickTimeout = setTimeout(param1.clickHandler,timeoutMS);
							}
						};
					}
					if(param1.mouseoverHandler){
						var fun = param1.mouseoverHandler;
						thisObj.onmouseover = fun;
					}
					if(param1.mouseoutHandler){
						var fun = param1.mouseoutHandler;
						thisObj.onmouseout = fun;
					}
					if(param1.mousedownHandler){
						thisObj.onmousedown = function(){
							var d = new Date();
							lastMousedown = thisMousedown;
							thisMousedown = d.getTime();
							if((thisMousedown - lastMousedown) > timeoutMS){
								onmousedownTimeout = setTimeout(param1.mousedownHandler,timeoutMS);
							}else{
								clearTimeout(onmousedownTimeout);
							}
						};
					}
					if(param1.mouseupHandler){
						thisObj.onmouseup = function(){
							var d = new Date();
							lastMouseup = thisMouseup;
							thisMouseup = d.getTime();
							if((thisMouseup - lastMouseup) > timeoutMS){
								onmouseupTimeout = setTimeout(param1.mouseupHandler,timeoutMS);
							}else{
								clearTimeout(onmouseupTimeout);
							}
						};
					}
					if(param1.dblclickHandler){
						thisObj.ondblclick = function(){
							clearTimeout(onclickTimeout);
							clearTimeout(onmousedownTimeout);
							clearTimeout(onmouseupTimeout);
							param1.dblclickHandler();
						};
					}
					if(param1.changeHandler){
						var fun = param1.changeHandler;
						thisObj.onchange = fun;
					}
					if(param1.keydownHandler){
						var fun = param1.keydownHandler;
						thisObj.onkeydown = fun;
					}
					if(param1.keyupHandler){
						var fun = param1.keyupHandler;
						thisObj.onkeyup = fun;
					}
					if(param1.keypressHandler){
						var fun = param1.keypressHandler;
						thisObj.onkeypress = fun;
					}
				
					//getvalue方法
					if(param1 == "getvalue"){
						returnValue = $(thisObj).attr("value");
					}
					//setvalue方法
					if(param1 == "setvalue"){
						var value = param2;
						$(thisObj).attr("value",value);
						$(thisObj).html(value);
					}
					//clear方法
					if(param1 == "clear"){
						$(thisObj).attr("value","");
						$(thisObj).html("");
					}
				}
				//defaultvalue属性
				if(readonlyInputArray[readonlyInputIndex].dataOptions){
					if(readonlyInputArray[readonlyInputIndex].dataOptions.defaultVal && $("#"+thisId).attr("class").indexOf("inited")<=0){
						$("#"+thisId).attr("value",readonlyInputArray[readonlyInputIndex].dataOptions.defaultVal).html(readonlyInputArray[readonlyInputIndex].dataOptions.defaultVal);
					}
				}
				//validtype属性,目前只有 num-only 有效
				if(readonlyInputArray[readonlyInputIndex].dataOptions){
					if(readonlyInputArray[readonlyInputIndex].dataOptions.validtype){
						$("#"+thisId).readonlyInputValidtype(readonlyInputArray[readonlyInputIndex].dataOptions.validtype);
					}
				}
				//按钮设置
				if(readonlyInputArray[readonlyInputIndex].dataOptions && readonlyInputArray[readonlyInputIndex].dataOptions.button){
					if($("#"+thisId).attr("class").indexOf("tan-chu-kuang-input")>=0){
						$("#"+thisId).css("width",$("#"+thisId).parent().parent().width()*0.4*0.62-$("#"+thisId).next().width()-8);
					}
						
					else if($("#"+thisId).attr("class").indexOf("search-input")>=0)
						$("#"+thisId).css("width",140-$("#"+thisId).next().width());
					var btnParam = readonlyInputArray[readonlyInputIndex].dataOptions.button;
					if(typeof btnParam == "string")
						btnParam = window[btnParam];
					var func = btnParam.handler;
					if(typeof func == "string")
						func = window[func];
					$("#"+thisId).next().get(0).onclick = func;
				}
				$("#"+thisId).addClass("inited");
			});
			return returnValue;
		}

		
		// 将元素中的 data-options 转换成 dataOptions 对象
		function dataOptionsHandler(str){
			var dataOptionsStr = str;
			var dataOptionsStrArray = dataOptionsStr.split(":");
			var dataOptions = {};
			for(var i=1;i<dataOptionsStrArray.length;i++){
				var j = i-1;
				var preArray = dataOptionsStrArray[j].split(",");
				var index = preArray[preArray.length-1].split("'")[0].split('"')[0];
				var thisArray = dataOptionsStrArray[i].split(",");
				if(i<dataOptionsStrArray.length-1){
					thisArray.pop();
				}
				for(var m=0;m<thisArray.length;m++){
					if(m==0){
						if(thisArray[m].indexOf("'")>=0){
							var strArray = thisArray[m].split("'");
							var str = strArray[1];
							thisArray[m] = str;
						}else if(thisArray[m].indexOf('"')>=0){
							var strArray = thisArray[m].split('"');
							var str = strArray[1];
							thisArray[m] = str;
						}
					}else{
						thisArray[m] = thisArray[m].split("'")[0].split('"')[0];
					}
				}
				var value = thisArray;
				if(value.length == 1 && index != "validtype"){
					value = value[0];
				}
				dataOptions[index] = value;
			}
			return dataOptions;
		}
		//判断变量是否是数组
		function isArray (array)
		{
			
			if ( array.constructor == window.Array )
			{
				return true;
			}
			else
			{
				return false;
			}
		}
		//判断目标参数是否为Object对象
		var isObject = function (source) {
			return 'function' == typeof source || !!(source && 'object' == typeof source);
		};
	}(window.jQuery);
	
	
	!function($){
		//初始化普通输入框
		var normalInputArray = {};
		//对validtype的处理，目前只有一个case 为 num-only
		$.fn.normalInputValidtype = function(validtype){
			if(!isArray(validtype)){
				validtype = validtype.split(",");
			}
			var obj = $(this);
			var id = obj.attr("id");
			for(var i=0;i<validtype.length;i++){
				switch(validtype[i]){
					case "num-only":
						$("#"+id).keypress(function(event){
							var keyCode = event.which; 
							if (keyCode == 46 || (keyCode >= 48 && keyCode <=57) || keyCode == 8)  
								return true;  
							else  
								return false;  
						}).focus(function() {  
							this.style.imeMode='disabled';  
						});
						break;
					case "required":
						if(obj.attr("class").indexOf("required")<=0){
							obj.addClass("required");
							if(obj.attr("placeholder")){
								obj.attr("placeholder",obj.attr("placeholder")+"(必填)");
							}else{
								obj.attr("placeholder","(必填)");
							}
						}
						break;
				}
			}
		}
		$(".normal-input").each(function(){
			var thisObj = $(this);
			var parent = thisObj.parent();
			var parentCls = parent.attr("class");
			var dataOptions;
			if(thisObj.attr("data-options")){
				var dataOptionsStr = thisObj.attr("data-options");
				dataOptions = dataOptionsHandler(dataOptionsStr);
				//alert(dataOptions.defaultVal);
				var normalInputIndex = thisObj.attr("name");
				
				if(normalInputArray[normalInputIndex]){
					for(var index in dataOptions){
						if(!normalInputArray[normalInputIndex].dataOptions[index]){
							normalInputArray[normalInputIndex].dataOptions[index] = dataOptions[index];
						}
					}
				}else{
					normalInputArray[normalInputIndex] = new NormalInput();
					normalInputArray[normalInputIndex].dataOptions = dataOptions;
				}
				
				if(normalInputArray[normalInputIndex]){
					if(normalInputArray[normalInputIndex].dataOptions.defaultVal){
						//alert(normalInputArray[normalInputIndex].dataOptions.defaultVal);
						var id = thisObj.attr("id");
						$("#"+id).attr("value",normalInputArray[normalInputIndex].dataOptions.defaultVal);
					}
					if(normalInputArray[normalInputIndex].dataOptions.validtype){
						thisObj.normalInputValidtype(normalInputArray[normalInputIndex].dataOptions.validtype);
					}
				}
			}
			if(parentCls == "search-keyword-area"){
				thisObj.wrap(document.createElement("div"));
				thisObj.addClass("search-input").addClass("value-displayer");
				var text = thisObj.attr("text");
				var parent = thisObj.parent();
				parent.addClass("input-prepend").addClass("search-input-group");
				thisObj.before('<span class="add-on search-name">'+text+'</span>');
				if(normalInputArray[normalInputIndex] && normalInputArray[normalInputIndex].dataOptions && normalInputArray[normalInputIndex].dataOptions.button){
					var btnText = "";
					if(normalInputArray[normalInputIndex].dataOptions.button.text)
						btnText = normalInputArray[normalInputIndex].dataOptions.button.text;
					thisObj.after('<div class="btn btn-small add-on input-group-button">'+btnText+'</div>');
					parent.addClass("input-append");
					thisObj.css("width",140-thisObj.next().width());
				}
			}else{
				thisObj.wrap(document.createElement("div"));
				thisObj.addClass("tan-chu-kuang-input").addClass("value-displayer");
				var text = thisObj.attr("text");
				var parent = thisObj.parent();
				parent.addClass("input-prepend").addClass("tan-chu-kuang-input-group");
				thisObj.before('<span class="add-on search-name">'+text+'</span>');
				if(normalInputArray[normalInputIndex] && normalInputArray[normalInputIndex].dataOptions && normalInputArray[normalInputIndex].dataOptions.button){
					var btnText = "";
					var func;
					if(typeof normalInputArray[normalInputIndex].dataOptions.button == "string")
						normalInputArray[normalInputIndex].dataOptions.button = window[normalInputArray[normalInputIndex].dataOptions.button];
					if(normalInputArray[normalInputIndex].dataOptions.button.text)
						btnText = normalInputArray[normalInputIndex].dataOptions.button.text;	
					thisObj.after('<div class="btn btn-small add-on input-group-button">'+btnText+'</div>');
					parent.addClass("input-append");
					thisObj.css("width",thisObj.parent().parent().width()*0.2-thisObj.next().width()-65);
				}
			}
			
		});
		//数字输入框
		
		
		
		function NormalInput(){
			this.dataOptions = {};
		}


		$.fn.setNormalInputAttr = function(param1,param2){
			var returnValue = $(this);
			$(this).each(function(){
				var thisId = $(this).attr("id");
				var thisObj = $(this).get(0);
				var normalInputIndex = $(thisObj).attr("name");
				normalInputArray[normalInputIndex] = new NormalInput();
				if(param1){
					if(isObject(param1)){
						normalInputArray[normalInputIndex].dataOptions = param1;
					}
				}
				if($(thisObj).attr("data-options")){
					var dataOptions = dataOptionsHandler($(thisObj).attr("data-options"));
					for(var index in dataOptions){
						if(normalInputArray[normalInputIndex]){
							if(!normalInputArray[normalInputIndex].dataOptions[index]){
								normalInputArray[normalInputIndex].dataOptions[index] = dataOptions[index];
							}
						}
					}
				}
				//绑定各种事件
				if(param1){
					var timeoutMS = 250;
					if(param1.timeoutMS){
						var timeoutMS = param1.timeoutMS;
					}
					var onclickTimeout;
					var lastClick = 0;
					var thisClick = 0;
					var onmousedownTimeout;
					var lastMousedown = 0;
					var thisMousedown = 0;
					var onmouseupTimeout;
					var lastMouseup = 0;
					var thisMouseup = 0;
					if(param1.clickHandler){
						thisObj.onclick = function(){
							var d = new Date();
							lastClick = thisClick;
							thisClick = d.getTime();
							if((thisClick - lastClick) > timeoutMS){
								onclickTimeout = setTimeout(param1.clickHandler,timeoutMS);
							}
						};
					}
					if(param1.mouseoverHandler){
						var fun = param1.mouseoverHandler;
						thisObj.onmouseover = fun;
					}
					if(param1.mouseoutHandler){
						var fun = param1.mouseoutHandler;
						thisObj.onmouseout = fun;
					}
					if(param1.mousedownHandler){
						thisObj.onmousedown = function(){
							var d = new Date();
							lastMousedown = thisMousedown;
							thisMousedown = d.getTime();
							if((thisMousedown - lastMousedown) > timeoutMS){
								onmousedownTimeout = setTimeout(param1.mousedownHandler,timeoutMS);
							}else{
								clearTimeout(onmousedownTimeout);
							}
						};
					}
					if(param1.mouseupHandler){
						thisObj.onmouseup = function(){
							var d = new Date();
							lastMouseup = thisMouseup;
							thisMouseup = d.getTime();
							if((thisMouseup - lastMouseup) > timeoutMS){
								onmouseupTimeout = setTimeout(param1.mouseupHandler,timeoutMS);
							}else{
								clearTimeout(onmouseupTimeout);
							}
						};
					}
					if(param1.dblclickHandler){
						thisObj.ondblclick = function(){
							clearTimeout(onclickTimeout);
							clearTimeout(onmousedownTimeout);
							clearTimeout(onmouseupTimeout);
							param1.dblclickHandler();
						};
					}
					if(param1.changeHandler){
						var fun = param1.changeHandler;
						thisObj.onchange = fun;
					}
					if(param1.keydownHandler){
						var fun = param1.keydownHandler;
						thisObj.onkeydown = fun;
					}
					if(param1.keyupHandler){
						var fun = param1.keyupHandler;
						thisObj.onkeyup = fun;
					}
					if(param1.keypressHandler){
						var fun = param1.keypressHandler;
						thisObj.onkeypress = fun;
					}
				
					//getvalue方法
					if(param1 == "getvalue"){
						returnValue = $(thisObj).val();
					}
					//setvalue方法
					if(param1 == "setvalue"){
						var value = param2;
						$(thisObj).val(value);
						$(thisObj).attr("value",value);
					}
					//clear方法
					if(param1 == "clear"){
						//alert($(thisObj).attr("id");
						$(thisObj).val("");
						$(thisObj).attr("value","");
					}
				}
				//defaultvalue属性
				if(normalInputArray[normalInputIndex].dataOptions){
					if(normalInputArray[normalInputIndex].dataOptions.defaultVal && $("#"+thisId).attr("class").indexOf("inited")<=0){
						$("#"+thisId).val(normalInputArray[normalInputIndex].dataOptions.defaultVal);
					}
				}
				//validtype属性,目前只有 num-only 有效
				if(normalInputArray[normalInputIndex].dataOptions){
					if(normalInputArray[normalInputIndex].dataOptions.validtype){
						$("#"+thisId).normalInputValidtype(normalInputArray[normalInputIndex].dataOptions.validtype);
					}
				}
				//button设置
				if(normalInputArray[normalInputIndex].dataOptions && normalInputArray[normalInputIndex].dataOptions.button){
					if($("#"+thisId).attr("class").indexOf("tan-chu-kuang-input")>=0){
						$("#"+thisId).css("width",$("#"+thisId).parent().parent().width()*0.4*0.62-$("#"+thisId).next().width()-32);
					}
					var buttonParam = normalInputArray[normalInputIndex].dataOptions.button;
					if(typeof buttonParam == "string")
						buttonParam = window[buttonParam];
					var func = buttonParam.handler;
					if(typeof func == "string")
						func = window[func];
					$("#"+thisId).next().get(0).onclick = func;
				}
				$("#"+thisId).addClass("inited");
			});
			return returnValue;
		}
		
		// 将元素中的 data-options 转换成 dataOptions 对象
		function dataOptionsHandler(str){
			var dataOptionsStr = str;
			var dataOptionsStrArray = dataOptionsStr.split(":");
			var dataOptions = {};
			for(var i=1;i<dataOptionsStrArray.length;i++){
				var j = i-1;
				var preArray = dataOptionsStrArray[j].split(",");
				var index = preArray[preArray.length-1].split("'")[0].split('"')[0];
				var thisArray = dataOptionsStrArray[i].split(",");
				if(i<dataOptionsStrArray.length-1){
					thisArray.pop();
				}
				for(var m=0;m<thisArray.length;m++){
					if(m==0){
						if(thisArray[m].indexOf("'")>=0){
							var strArray = thisArray[m].split("'");
							var str = strArray[1];
							thisArray[m] = str;
						}else if(thisArray[m].indexOf('"')>=0){
							var strArray = thisArray[m].split('"');
							var str = strArray[1];
							thisArray[m] = str;
						}
					}else{
						thisArray[m] = thisArray[m].split("'")[0].split('"')[0];
					}
				}
				var value = thisArray;
				if(value.length == 1 && index != "validtype"){
					value = value[0];
				}
				dataOptions[index] = value;
			}
			return dataOptions;
		}
		//判断变量是否是数组
		function isArray (array)
		{
			
			if ( array.constructor == window.Array )
			{
				return true;
			}
			else
			{
				return false;
			}
		}
		//判断目标参数是否为Object对象
		var isObject = function (source) {
			return 'function' == typeof source || !!(source && 'object' == typeof source);
		};
	}(window.jQuery);


	!function($){
		var objArray = {};
		var dblclickFunctionArray = {};
		var selectedRowArray = {};
		var tableArray = {};
		function setInputTextStyle(){
			$("input[type=text],textarea").each(function(){
				var obj = $(this);
				obj.focus(function(){
					$(".search-name,.textarea-group-treegrid.html-title,.textarea-group-2-title").css("border-color","#ccc").css("background-color","#eee").css("color","#333").css("text-shadow","0 1px 0 #fff");
					$(".tan-chu-kuang-input-group .btn-primary,.search-input-group .btn-primary").removeClass("btn-primary");
					$(".dropdown-menu").hide();
					obj.parent().children(".search-name,.textarea-group-treegrid.html-title,.textarea-group-2-title").css("border-color","#6654ea").css("background-color","#6654ea").css("color","white").css("text-shadow","0 0 0 #fff");
					if(obj.next().length>0)
						obj.next().addClass("btn-primary").css("text-shadow","0 0 0 #fff");
				}).blur(function(){
					if(obj.next().length>0)
						obj.next().removeClass("btn-primary").css("text-shadow","0 1px 0 #fff");
					obj.parent().children(".search-name").css("border-color","#ccc").css("background-color","#eee").css("color","#333").css("text-shadow","0 1px 0 #fff");
				});
			});
			$(".rowsInEveryPage,.jumpToPage").each(function(){
				var obj = $(this);
				//alert(obj.attr("class"));
				obj.focus(function(){
					$(".search-name").css("border-color","#ccc").css("background-color","#eee").css("color","#333").css("text-shadow","0 1px 0 #fff");
					$(".tan-chu-kuang-input-group .btn-primary,.search-input-group .btn-primary").removeClass("btn-primary");
					$(".dropdown-menu").hide();
					obj.parent().children("span").css("border-color","#383838").css("background-color","#383838").css("color","red").css("text-shadow","0 0 0 red");
				}).blur(function(){
					obj.parent().children("span").css("border-color","#ccc").css("background-color","#eee").css("color","#333").css("text-shadow","0 1px 0 #fff");
				});
			});
		}
		//当点击页面其他地方的时候，关闭下拉框
		function closeAllDropdownWhenClickHTMLBody(){
			$(".dropdown,.dropdown-menu").each(function(){
				$(this).click(function(event){
					event.stopPropagation();
				});
			});
			$("body").click(function(){
				$(".dropdown-menu").hide();
			});
		}
		//对双击元素绑定双击响应方法
		function bindDblclickAction(){
			var id = $(this).parent().parent().attr("id");
			var fun = tableArray[id].dblclickHandler;
			$(this).unbind("dblclick");
			this.ondblclick = fun;
			$(this).addClass("tr-mouseover");
		}
		
		
		//trMouseOut方法
		function trMouseOut(){
			$(this).removeClass("tr-mouseover");
		}
		//写入表头内容
		function setTableHead(array,id){
			var total_columns = array.table_area.table_head.length;
			var html = "";
			html = html + '<tr>';
			if(array.table_area.checkbox_column){
				html = html + '<th class="checkbox-TD">';
			}
			for(var i=0;i<total_columns;i++){
				html = html + '<th>'+array.table_area.table_head[i].column_title+'</th>';
			}
			html = html + '</tr>';
			$("#LI-page-"+id+" .my-table thead").html(html);
		}
		//写入表格内容
		function setTableBody(array,id){
			var total_rows = array.table_area.table_body.total;
			var total_columns = array.table_area.table_head.length;
			for(var i=0;i<total_rows;i++){
				var html = "";
				html = html + '<tr>';
				if(array.table_area.checkbox_column){
					html = html + '<td class="checkbox-TD"><input type="checkbox" class="index-table-checkbox"></td>';
				}
				for(var j=0;j<total_columns;j++){
					var index = array.table_area.table_head[j].column_id;
					html = html + '<td>'+array.table_area.table_body.rows[i][index]+'</td>';
				}
				html = html + '</tr>';
				$("#LI-page-"+id+" .my-table tbody").append(html);
			}
		}
		
		//数字输入框
		$(".num-only").keypress(function(event) {  
			var keyCode = event.which; 
			if (keyCode == 46 || (keyCode >= 48 && keyCode <=57) || keyCode == 8)  
				return true;  
			else  
				return false;  
		}).focus(function() {  
			this.style.imeMode='disabled';  
		});





		//table组件
		//初始化table
		
		$.fn.initTable = function(array){
			var thisObj = $(this).get(0);
			var id = $(thisObj).attr("id");
			var tablePageIndex = id+"_pageIndex";
			window[tablePageIndex] = new PageIndex(id);
			if(!tableArray[id]){
				tableArray[id] = {};
			}
			if($(thisObj).attr("data-options")){
				var dataOptionsStr = $(thisObj).attr("data-options");
				var dataOptions = dataOptionsHandler(dataOptionsStr);
				if(dataOptions.dblclickHandler && !tableArray[id].dblclickHandler){
					tableArray[id].dblclickHandler = window[dataOptions.dblclickHandler];
				}
				if(dataOptions.toolbar && !tableArray[id].toolbar){
					tableArray[id].toolbar = window[dataOptions.toolbar];
				}
				if(dataOptions.ifCheckBox && !tableArray[id].ifCheckBox){
					tableArray[id].ifCheckBox = dataOptions.ifCheckBox;
				}
				if(dataOptions.checkBoxFor && !tableArray[id].checkBoxfor){
					tableArray[id].checkBoxFor = dataOptions.checkBoxFor;
				}
				if(dataOptions.ifPage && !tableArray[id].ifPage){
					tableArray[id].ifPage = dataOptions.ifPage;
				}
				if(dataOptions.url && !tableArray[id].url){
					tableArray[id].url = dataOptions.url;
				}
				if(array){
					for(var index in array){
						tableArray[id][index] = array[index];
					}
				}
			}else if(array){
				tableArray[id] = array;
			}
			$(this).parent().parent().before('<div class="tool-panel"></div>');
			var toolPanel = $(this).parent().parent().parent().find(".tool-panel").get(0);
			if(tableArray[id]){
				if(tableArray[id].ifCheckBox)
				var ifCheckBox = tableArray[id].ifCheckBox;
				if(tableArray[id].checkBoxFor)
				var checkBoxFor = tableArray[id].checkBoxFor;
				if(tableArray[id].ifPage)
				var ifPage = tableArray[id].ifPage;
				if(tableArray[id].url)
				var url = tableArray[id].url;
				if(tableArray[id].dblclickHandler)
				var dblclickHandler = tableArray[id].dblclickHandler;
			}
			var id = $(this).attr("id");
			$(this).attr("url",url);
			$(this).addClass("table").addClass("table-condensed").addClass("my-table");
			if(ifCheckBox && ifCheckBox != "false"){
				var html = $(this).children("thead").children("tr").html();
				html = '<th class="checkbox-TD" checkBoxFor="'+checkBoxFor+'"></th>' + html;
				$(this).children("thead").children("tr").html(html);
				var toolArray = [{"text":"全选","type":"checkbox-button","selectAllInTabId":$(this).attr("id")}];
				$(toolPanel).setToolArea(toolArray);
				setButtonStyle();
			}
			if(array){
				if(array.toolbar){
					$(toolPanel).setToolArea(array.toolbar);
					setButtonStyle();
				}else if(tableArray[id].toolbar){
					$(toolPanel).setToolArea(tableArray[id].toolbar);
					setButtonStyle();
				}
			}else if(tableArray[id].toolbar){
				$(toolPanel).setToolArea(tableArray[id].toolbar);
				setButtonStyle();
			}
			var obj_array = [];
			$(this).each(function(){
				if(this.getElementsByTagName("th")){
					obj_array = this.getElementsByTagName("th");
				}
			});
			var column_id_array = [];
			for(var i=0;i<obj_array.length;i++){
				column_id_array[i] = obj_array[i].getAttribute("column_id");
			}
			//alert(ifPage);
			if(ifPage && ifPage != "false"){
				$(this).parent().parent().parent().children(".page-index-area").show();
				setInputTextStyle();
			}else{
				$(this).parent().parent().parent().children(".page-index-area").hide();
			}
			$(this).initTableData();
			return $(this);
		}
		//用json初始化table
		$.fn.initTableByJson = function(array,ifCheckBox){
			var length = array.length;
			var html = "";
			html = html + '<tr>';
			if(ifCheckBox){
				html = html + '<th class="checkbox-TD"></th>';
			}
			for(var i=0;i<length;i++){
				html = html + '<th>'+array[i].column_title+'</th>';
			}
			html = html + '</tr>';
			$(this).children("thead").html(html);
		};
		//初始化table数据
		$.fn.initTableData = function(){
			var id = $(this).attr("id");
			var ifPage = false;
			if(tableArray[id]){
				if(tableArray[id].ifPage){
					ifPage = tableArray[id].ifPage;
				}
			}
			var obj = $(this);
			var url=$(this).attr("url");
			if(ifPage && ifPage != "false"){
				var data = {"page":1,"rows":20};
				$ajax("POST",url,data,function(po){obj.refreshTable(po);},function(error){alert("ajax请求出错！");});
			}else{
				var data = {"page":1,"rows":1000};
				$ajax("POST",url,data,function(po){obj.refreshTable(po);},function(error){alert("ajax请求出错！");});
			}
			return $(this);
		}
		//table刷新
		$.fn.refresh = function(array){
			delete selectedRowArray[$(this).attr("id")];
			//alert("currentPage="+$(this).parent().parent().next().find(".current-page").html()+",rowsInEveryPage="+$(this).parent().parent().next().find(".rowsInEveryPage").val());
			if(!array){
				array = {
					page:$(this).parent().parent().next().find(".current-page").html(),
					rows:$(this).parent().parent().next().find(".rowsInEveryPage").val()
				}
			}else{
				if(!array.page){
					array.page = $(this).parent().parent().next().find(".current-page").html();
				}
				if(!array.rows){
					array.rows = $(this).parent().parent().next().find(".rowsInEveryPage").val();
				}
			}
			var id = $(this).attr("id");
			var ifPage = false;
			if(tableArray[id]){
				if(tableArray[id].ifPage){
					ifPage = tableArray[id].ifPage;
				}
			}
			var obj = $(this);
			var url=$(this).attr("url");
			if(ifPage && ifPage != "false"){
				$ajax("POST",url,array,function(po){obj.refreshTable(po);},function(error){alert("ajax请求出错！");});
			}else{
				$ajax("POST",url,"",function(po){obj.refreshTable(po);},function(error){alert("ajax请求出错！");});
			}
			return $(this);
		}
		//table数据写入
		$.fn.refreshTable = function(po){
			var id = $(this).attr("id");
			var ifPage = false;
			if(tableArray[id]){
				if(tableArray[id].ifPage){
					ifPage = tableArray[id].ifPage;
				}
			}
			objArray[$(this).attr("id")] = {};
			if(po.total=="-treegrid.html"){
				alert(po.message);
				return;
			}
			var obj_array = [];
			$(this).each(function(){
				obj_array = this.getElementsByTagName("th");
			});
			var column_id_array = [];
			for(var i=0;i<obj_array.length;i++){
				column_id_array[i] = obj_array[i].getAttribute("column_id");
			}
			var ifCheckBox = $(this).children("thead").children("tr").children(".checkbox-TD").length;
			var length = $(this).children("thead").children("tr").children().length - ifCheckBox;
			var html = "";
			var length = column_id_array.length;
			if(ifCheckBox == 1){
				var checkBoxFor;
				$(this).children("thead").children("tr").children(".checkbox-TD").each(function(){
					checkBoxFor = this.getAttribute("checkBoxFor");
				});
			}
			if(po.rows){
				for(var j=0;j<po.rows.length;j++){
					if(po.rows[j])
						po.rows[j].rowid = j;
					html = html + '<tr rowsId="'+po.rows[j].rowid+'" >';
					if(ifCheckBox == 1){
						html = html + '<td class="checkbox-TD" checkBoxFor='+checkBoxFor+'><input type="checkbox" class="index-table-checkbox" id="checkbox_'+id+'_'+po.rows[j].rowid+'"/></td>';
					}
					var i = ifCheckBox;
					for(;i<length;i++){
						var index = column_id_array[i];
						//alert(index);
						html = html + '<td>'+po.rows[j][index]+'</td>';
					}
					html = html + '</tr>';
					objArray[$(this).attr("id")][po.rows[j].rowid] = po.rows[j];
				}
				$(this).children("tbody").html(html);
				$(this).find("tbody tr").mouseover(bindDblclickAction).click(selectRow).mouseout(trMouseOut);
			}
			$(".index-table-checkbox").click(function(event){
				event.stopPropagation();
			});
			$(".index-table-checkbox").dblclick(function(event){
				event.stopPropagation();
			});
			if(ifPage && ifPage != "false"){
				var tablePageIndex = id+"_pageIndex";
				window[tablePageIndex].setTotalRecords(po.total);
				$(this).parent().parent().parent().children(".page-index-area").show();
			}else{
				$(this).parent().parent().parent().children(".page-index-area").hide();
			}
			return $(this);
		}
		//table翻页导航
		function PageIndex(tableId){
			var pageIndexHtml = "";
			pageIndexHtml = pageIndexHtml + '<span class="page-index-area">';
				pageIndexHtml = pageIndexHtml + '<div class="total-records-info">共<span class="total-pages-num">treegrid.html</span>页，<span class="total-records-num">0</span>条记录</div>';
				pageIndexHtml = pageIndexHtml + '<div class="input-prepend input-append jump-to-page">';
					pageIndexHtml = pageIndexHtml + '<span class="add-on">跳转到第</span>';
					pageIndexHtml = pageIndexHtml + '<input type="text" value=treegrid.html name="jumpToPage" class="num-only jumpToPage" id="page-jump-input"/>';
					pageIndexHtml = pageIndexHtml + '<span class="add-on">页</span>';
					pageIndexHtml = pageIndexHtml + '<div class="btn btn-small btn-inverse" id="do-page-jump">GO</div>';
				pageIndexHtml = pageIndexHtml + '</div>';
				pageIndexHtml = pageIndexHtml + '<div class="pagination pagination-mini page-index" id="page-index">';
					pageIndexHtml = pageIndexHtml + '<ul>';
						pageIndexHtml = pageIndexHtml + '<li><a href="javascript:void(0)" class="page-button" id="to-first-page"><span class="icon-fast-backward"></span></a></li>';
						pageIndexHtml = pageIndexHtml + '<li><a href="javascript:void(0)" class="page-button" id="to-pre-page"><span class="icon-chevron-left"></span></a></li>';
						pageIndexHtml = pageIndexHtml + '<li><a href="javascript:void(0)" class="page-button" id="to-next-page"><span class="icon-chevron-right"></span></a></li>';
						pageIndexHtml = pageIndexHtml + '<li><a href="javascript:void(0)" class="page-button" id="to-last-page"><span class="icon-fast-forward"></span></a></li>';
					pageIndexHtml = pageIndexHtml + '</ul>';
				pageIndexHtml = pageIndexHtml + '</div>';
				pageIndexHtml = pageIndexHtml + '<div class="input-prepend input-append rows-in-every-page">';
				pageIndexHtml = pageIndexHtml + '	<span class="add-on">每页</span>';
					pageIndexHtml = pageIndexHtml + '<input type="text" value=20 name="rowsInEveryPage" class="num-only rowsInEveryPage" />';
					pageIndexHtml = pageIndexHtml + '<span class="add-on">条记录</span>';
				pageIndexHtml = pageIndexHtml + '</div>';
			pageIndexHtml = pageIndexHtml + '</span>';
			$("#"+tableId).parent().parent().parent().find(".page-index-area").remove();
			$("#"+tableId).parent().parent().after(pageIndexHtml);
			var total_pages;
			this.tableObj = $("#"+tableId).get(0);
			this.currentPage = 1;
			this.rowsInEveryPage = 20;
			this.totalRecords;
			this.totalPages = Math.ceil(this.totalRecords/this.rowsInEveryPage);
			this.pageIndexSize = 10;
			this.setRowsInEveryPage = function(num){
				this.rowsInEveryPage = num;
			}
			this.setTotalRecords = function(num){
				this.rowsInEveryPage = $("#"+tableId).parent().parent().next().find(".rowsInEveryPage").val();
				this.totalRecords = num;
				this.totalPages = Math.ceil(this.totalRecords/this.rowsInEveryPage);
				total_pages = this.totalPages;
				var pageIndexArray;
				var beginPage;
				var endPage;
				if(this.currentPage%this.pageIndexSize != 0){
					//alert(treegrid.html);
					beginPage = Math.floor(this.currentPage/this.pageIndexSize)*this.pageIndexSize + 1;
				}else{
					//alert(2);
					beginPage = this.currentPage - 9;
				}
				if(this.currentPage%this.pageIndexSize != 0){
					//alert(3);
					endPage = Math.ceil(this.currentPage/this.pageIndexSize)*this.pageIndexSize;
				}else{
					//alert(4);
					endPage = this.currentPage;
				}
				if(endPage>this.totalPages)
					endPage = this.totalPages;
					
				//alert("totalRecords="+this.totalRecords+" & pageIndexSize="+this.pageIndexSize+" & totalPages="+this.totalPages+" & currentPage="+this.currentPage+" & beginPage="+beginPage+" & endPage="+endPage);
				var html = "";
				for(var i=beginPage;i<=endPage;i++){
					if(i==this.currentPage){
						html = html + '<li><a href="javascript:void(0)" class="page-index-button current-page">'+i+'</a></li>';
					}else{
						html = html + '<li><a href="javascript:void(0)" class="page-index-button">'+i+'</a></li>';
					}
				}
				$("#"+tableId).parent().parent().next().find(".page-index-button").remove();
				$("#"+tableId).parent().parent().next().find("#to-pre-page").parent().after(html);
				$("#"+tableId).parent().parent().next().find(".page-index-button").each(function(){
					$(this).click(function(){
						var num = $(this).html();
						var tablePageIndex = tableId+"_pageIndex";
						window[tablePageIndex].jumpToPage(num);
					});
				});
				var tablePageIndex = tableId+"_pageIndex";
				$("#"+tableId).parent().parent().next().find(".total-pages-num").html(window[tablePageIndex].totalPages);	
				$("#"+tableId).parent().parent().next().find(".total-records-num").html(window[tablePageIndex].totalRecords);
			}
			$("#"+tableId).parent().parent().next().find("#to-pre-page").click(function(){
				var tablePageIndex = tableId+"_pageIndex";
				window[tablePageIndex].pageUp();
			});
			$("#"+tableId).parent().parent().next().find("#to-next-page").click(function(){
				var tablePageIndex = tableId+"_pageIndex";
				window[tablePageIndex].pageDown();
			});
			$("#"+tableId).parent().parent().next().find("#to-first-page").click(function(){
				var tablePageIndex = tableId+"_pageIndex";
				window[tablePageIndex].toFirstPage();
			});
			$("#"+tableId).parent().parent().next().find("#to-last-page").click(function(){
				var tablePageIndex = tableId+"_pageIndex";
				window[tablePageIndex].toLastPage();
			});
			$("#"+tableId).parent().parent().next().find("#do-page-jump").click(function(){
				if($("#"+tableId).parent().parent().next().find("#page-jump-input").val()){
					var num = $("#"+tableId).parent().parent().next().find("#page-jump-input").val();
					var tablePageIndex = tableId+"_pageIndex";
					window[tablePageIndex].jumpToPage(num);
				}else{
					alert("请输入要跳转到的页码数！");
				}
			});
			this.pageUp = function(){
				this.rowsInEveryPage = $("#"+tableId).parent().parent().next().find(".rowsInEveryPage").val();
				if(this.currentPage>1){
					this.currentPage--;
					this.pageInfoArray = {
						'page':this.currentPage,
						'rows':this.rowsInEveryPage
					}
					$(this.tableObj).refresh(this.pageInfoArray);
					var tablePageIndex = tableId+"_pageIndex";
					$("#"+tableId).parent().parent().next().find(".total-pages-num").html(window[tablePageIndex].totalPages);	
					$("#"+tableId).parent().parent().next().find(".total-records-num").html(window[tablePageIndex].totalRecords);
				}else{
					return;
				}
			}
			this.pageDown = function(){
				this.rowsInEveryPage = $("#"+tableId).parent().parent().next().find(".rowsInEveryPage").val();
				if(this.currentPage<this.totalPages){
					this.currentPage++;
					this.pageInfoArray = {
						'page':this.currentPage,
						'rows':this.rowsInEveryPage
					}
					$(this.tableObj).refresh(this.pageInfoArray);
					var tablePageIndex = tableId+"_pageIndex";
					$("#"+tableId).parent().parent().next().find(".total-pages-num").html(window[tablePageIndex].totalPages);	
					$("#"+tableId).parent().parent().next().find(".total-records-num").html(window[tablePageIndex].totalRecords);
				}else{
					return;
				}
			}
			this.jumpToPage = function(num){
				this.rowsInEveryPage = $("#"+tableId).parent().parent().next().find(".rowsInEveryPage").val();
				this.currentPage = num;
				this.pageInfoArray = {
					'page':this.currentPage,
					'rows':this.rowsInEveryPage
				}
				$(this.tableObj).refresh(this.pageInfoArray);
				var tablePageIndex = tableId+"_pageIndex";
				$("#"+tableId).parent().parent().next().find(".total-pages-num").html(window[tablePageIndex].totalPages);	
				$("#"+tableId).parent().parent().next().find(".total-records-num").html(window[tablePageIndex].totalRecords);
			}
			this.toFirstPage = function(){
				this.rowsInEveryPage = $("#"+tableId).parent().parent().next().find(".rowsInEveryPage").val();
				this.currentPage = 1;
				this.pageInfoArray = {
					'page':this.currentPage,
					'rows':this.rowsInEveryPage
				}
				$(this.tableObj).refresh(this.pageInfoArray);
				var tablePageIndex = tableId+"_pageIndex";
				$("#"+tableId).parent().parent().next().find(".total-pages-num").html(window[tablePageIndex].totalPages);	
				$("#"+tableId).parent().parent().next().find(".total-records-num").html(window[tablePageIndex].totalRecords);
			}
			this.toLastPage = function(){
				this.rowsInEveryPage = $("#"+tableId).parent().parent().next().find(".rowsInEveryPage").val();
				this.currentPage = this.totalPages;
				this.pageInfoArray = {
					'page':this.currentPage,
					'rows':this.rowsInEveryPage
				}
				$(this.tableObj).refresh(this.pageInfoArray);
				var tablePageIndex = tableId+"_pageIndex";
				$("#"+tableId).parent().parent().next().find(".total-pages-num").html(window[tablePageIndex].totalPages);	
				$("#"+tableId).parent().parent().next().find(".total-records-num").html(window[tablePageIndex].totalRecords);
			}
			$(".jumpToPage").each(function(){
				$(this).focus(function(){
					$(this).select();
				}).keyup(function(){
					var value = $(this).parent().find("#page-jump-input").val();
					//alert("value="+value+"  totalPages="+total_pages);
					if(value>total_pages){
						alert("输入的页数不能超过总页数！");
						$(this).val(total_pages);
						return false;
					}
				}).keypress(function(event){
					var keycode = event.which;
					if(keycode == 13){
						if($("#"+tableId).parent().parent().next().find("#page-jump-input").val()){
							var num = $("#"+tableId).parent().parent().next().find("#page-jump-input").val();
							var tablePageIndex = tableId+"_pageIndex";
							window[tablePageIndex].jumpToPage(num);
							$("#"+tableId).parent().parent().next().find(".total-pages-num").html(window[tablePageIndex].totalPages);	
							$("#"+tableId).parent().parent().next().find(".total-records-num").html(window[tablePageIndex].totalRecords);
						}else{
							alert("请输入要跳转到的页码数！");
						}
					};
				});
			});
			$(".rowsInEveryPage").each(function(){
				$(this).focus(function(){
					$(this).select();
				}).keypress(function(event){
					var keycode = event.which;
					if(keycode == 13){
						if($(this).val()){
							var tablePageIndex = tableId+"_pageIndex";
							window[tablePageIndex].jumpToPage(1);
							$("#"+tableId).parent().parent().next().find(".total-pages-num").html(window[tablePageIndex].totalPages);	
							$("#"+tableId).parent().parent().next().find(".total-records-num").html(window[tablePageIndex].totalRecords);
						}else{
							alert("请输入每页所要显示的记录条数！");
						}
					}
				});
			});
		}
		
		//选中行方法(改变选中行的颜色，并将其对应的Object加入table所对应的选中行对象中)
		var canBlur = true;
		var canBlurTimeout;
		var canBlurLockTime = 400;
		function selectRow(){
			var thisObj = $(this).get(0)
			var tableId = $(thisObj).parent().parent().attr("id");
			var rows = objArray[tableId];
			var rowsId = $(thisObj).attr("rowsId");
			var object = rows[rowsId];
			if(!selectedRowArray[tableId]){
				selectedRowArray[tableId] = object;
				$(thisObj).parent().children("tr").removeClass("tr-selected");
				$(thisObj).addClass("tr-selected");
				canBlur = false;
				canBlurTimeout = setTimeout(function(){canBlur = true},canBlurLockTime);
			}else if(canBlur && $("tr[rowsid="+rowsId+"]").attr("class") && $("tr[rowsid="+rowsId+"]").attr("class").indexOf("tr-selected")>=0){
				delete selectedRowArray[tableId];
				$(thisObj).removeClass("tr-selected");
			}else{
				selectedRowArray[tableId] = object;
				$(thisObj).parent().children("tr").removeClass("tr-selected");
				$(thisObj).addClass("tr-selected");
				canBlur = false;
				canBlurTimeout = setTimeout(function(){canBlur = true},canBlurLockTime);
			}
			//alert($("#my-table_01").getSelectedObject().id);
		}
		
		//获取表格中被选中的行所对应的对象
		$.fn.getSelectedObject = function(){
			var tableId = $(this).attr("id");
			var object = selectedRowArray[tableId];
			return object;
		}
		//获取列表行对应的对象
		$.fn.getObject = function(){
			var id = $(this).parent().parent().attr("id");
			var rows = objArray[id];
			var rowsId = $(this).attr("rowsId");
			var object = rows[rowsId];
			return object;
		}
		$.fn.setToolArea = function(toolArray){
			var obj = $(this);
			var length = toolArray.length;
			
			for(var i=0;i<length;i++){
				if(toolArray[i].type == "checkbox-button" && toolArray[i].selectAllInTabId){
					var html = "";
					html = html + '<div class="tool-button"><label for="'+toolArray[i].id+'" class="select-all-label"><input type="checkbox" class="select-all" id="'+toolArray[i].id+'">'+toolArray[i].text+'</label></div>';
					obj.append(html);
					var selectAllInTabId = toolArray[i].selectAllInTabId;
					obj.children(".tool-button").children(".select-all-label").children("input.select-all").each(function(){
						set_select_all($(this).attr("id"),selectAllInTabId);
					});
				}else if(toolArray[i].type == "checkbox-button"){
					var html = "";
					html = html + '<div class="tool-button"><label for="'+toolArray[i].id+'" class="select-all-label"><input type="checkbox" class="select-all" id="'+toolArray[i].id+'">'+toolArray[i].text+'</label></div>';
					obj.append(html);
					obj.children(".tool-button").children(".select-all-label").children("input.select-all").each(function(){
						$(this).parent().parent().click(function(){
							fun();
						});
					});
				}else{
					var html = "";
					html = html + '<div class="tool-button" id="'+toolArray[i].id+'"><span class="icon '+toolArray[i].type+'"></span>'+toolArray[i].text+'</div>';
					obj.append(html);
					var fun = toolArray[i].handler;
					var button = obj.find("."+toolArray[i].type).parent().get(0);
					button.onclick = fun;
				}
			}	
			return $(this);
		}
		//清楚弹出窗口
		function clearPopoutWindow(){
			var popoutWindowIdArray = [];
			$(".include-page-area").children().each(function(){
				popoutWindowIdArray.push($(this).attr("id"));
			});
			for(var i=0;i<popoutWindowIdArray.length;i++){
				window.parent.$("#"+popoutWindowIdArray[i]).remove();
			}
			return $(this);
		}
		//设置弹出窗口属性并显示弹出窗口
		function showPopoutWindow(windowId){
			window.parent.$(".zhe-zhao-ceng").css("width",$(window.parent.document).width()).css("height",$(window.parent.document).height()).show();
			var window_height = $(window.parent).height();
			var window_width = $(window.parent).width();
			var scroll_top = $(window.parent).scrollTop();
			var scroll_left = $(window.parent).scrollLeft();
			var top = window_height/2 + scroll_top - 250;
			if(top<0){
				top=0;
			}
			var left = window_width/2 + scroll_left - 350;
			$(".dropdown-menu").hide();
			window.parent.$("#"+windowId).css("top",top+"px").css("left",left+"px");
			window.parent.$("#"+windowId).slideDown("fast");
		}
		//在list页中获取弹出窗口的window对象的方法
		function getPopoutWindow(windowId){
			var popoutWindow;
			popoutWindow = window.parent.document.getElementById(windowId).contentWindow;
			return popoutWindow;
		}
		//ajax方法
		function $ajax(type,url,data,callback_function,error_function){
			$.ajax({
				"type":type,
				"url":url,
				"data":data,
				"success":callback_function,
				"error":error_function,
				"timeout":function(){
					alert("请求超时！");
				}
			});
		}
		//打开列表ajax请求
		$.fn.open_grid = function(url,LI_page_id){
				$(this).click(function(){
					$ajax("POST",url,{"current_page":1,"rows":20},function(str){$("#"+LI_page_id).html(str);},function(error){alert("ajax请求出错！");});
				});
				return $(this);
		}
		
		

		//在弹出框中获取LIST页面中的回调函数
		function getCallbackFunction(functionName){
			var fun = window.parent.document.getElementById('LI-page-01').contentWindow[functionName];
			return fun;
		}
		//在弹出框中设置LIST页面中的回调函数
		function setCallbackFunction(functionName){
			var fun = getCallbackFunction(functionName);
			document.getElementById("close-window-button").onclick = fun;
		}

		//判断目标参数是否为Object对象
		var isObject = function (source) {
			return 'function' == typeof source || !!(source && 'object' == typeof source);
		};

		//生成tab页面
		function ListPage(listPageParam){
			var pages = listPageParam.pages;
			this.width = 600;
			this.height = 300;
			if(listPageParam.width){
				this.width = listPageParam.width;
			}
			if(listPageParam.height){
				this.height = listPageParam.height;
			}
			for(var i=0;i<pages.length;i++){
				var page = pages[i];
			}
		}
		$.fn.initTabPage = function(param){
				var thisObj = $(this).get(0);
				var width = 600;
				var height = 300;
				var thisObjDataOptions = {};
				if($(thisObj).attr("data-options")){
					var thisObjDataOptionsStr = $(thisObj).attr("data-options");
					thisObjDataOptions = dataOptionsHandler(thisObjDataOptionsStr);
				}
				if(param){
					for(var index in param){
						thisObjDataOptions[index] = param[index];
					}
				}
				if(thisObjDataOptions.width)
					width = thisObjDataOptions.width.split("px")[0];
				if(thisObjDataOptions.height)
					height = thisObjDataOptions.height.split("px")[0];
				$(thisObj).css("position","relative").css("width",width+"px").css("height",height+"px").css("border-radius","5px 5px 5px 5px");
				
				var liAreaHtml = '<div class="LI-area"><ul class="nav nav-tabs"></ul></div>';
				if($(thisObj).children().length>0){
					var children = $(thisObj).children();
					var firstChild = children.first();
					firstChild.before(liAreaHtml);
					children.each(function(){
						var dataOptions = {};
						if($(this).attr("data-options")){
							var dataOptionsStr = $(this).attr("data-options");
							dataOptions = dataOptionsHandler(dataOptionsStr);
						}
						var pageHeight = height-30;
						$(this).css("width",width+"px").css("height",pageHeight+"px").css("position","absolute").css("top","28px").css("left","0");
						//alert("name="+dataOptions.name+" & title="+dataOptions.title);
						var html = '<li title='+dataOptions.title+' name='+dataOptions.name+' ><a href="javascript:void(0)" class="li" ><span>'+dataOptions.title+'</span><span style="display:none;color:red;font-weight:400;font-family:arial;font-size:20px;position:relative;left:2px;top:-2px;" class="close-tab-page">×</span></a></li>';
						$(thisObj).find(".nav").append(html);
						$(thisObj).find(".close-tab-page").click(function(){
							var obj = $(this);
							$(thisObj).deleteTabPage(obj.parent().parent().attr("name"));
						});
						$(thisObj).find("li").each(function(){
							$(this).mouseover(function(){
								$(this).find("a").css("padding-left",6).css("padding-right",6).css("padding-top","7px").find(".close-tab-page").show();
							}).mouseout(function(){
								$(this).find("a").css("padding-left",12).css("padding-right",12).css("padding-top","8px").find(".close-tab-page").hide();
							});
						});
						$(this).attr("name",dataOptions.name);
						$(thisObj).find(".LI-on").removeClass("LI-on");
						$(thisObj).find(".nav").children("li").first().find("a").addClass("LI-on");
					});
				}else{
					$(thisObj).html(liAreaHtml);
				}
				$(thisObj).find(".nav").children("li").click(function(){
					var name = $(this).attr("name");
					$(thisObj).find(".LI-page").hide();
					$(thisObj).find(".LI-page[name="+name+"]").show();
					$(thisObj).find(".nav li a").removeClass("LI-on");
					$(this).find("a").addClass("LI-on");
				});
				if(param){
					$(thisObj).addTabPage(param);
				}
				$(thisObj).find(".LI-area").css("border-radius","4px 4px 0 0");
			
			return $(this);
		}
		$.fn.addTabPage = function(param){
				var thisObj = $(this).get(0);
				$(thisObj).find(".nav .lI-on").removeClass("LI-on");
				$(thisObj).find(".LI-page").hide();
				var pages = param.pages;
				if($(thisObj).attr("id")=="center-area"){
					for(var i=0;i<pages.length;i++){
						if($(thisObj).find("li[name='"+pages[i].name+"']").length == 0){
							var page = pages[i];
							var liAreaHtml = '<li title='+page.title+' name='+page.name+' ><a href="javascript:void(0)"><span>'+page.title+'</span><span style="display:none;color:red;font-weight:400;font-family:arial;font-size:20px;position:relative;left:2px;top:-2px;" class="close-tab-page">×</span></a></li>';
							$(thisObj).find(".nav").append(liAreaHtml);
							$(thisObj).find("li[name='"+page.name+"'] .close-tab-page").click(function(){
								$(thisObj).deleteTabPage(page.name);
							});
							$(thisObj).find("li").each(function(){
								$(this).mouseover(function(){
									$(this).find("a").css("padding-left",6).css("padding-right",6).css("padding-top","7px").find(".close-tab-page").show();
								}).mouseout(function(){
									$(this).find("a").css("padding-left",12).css("padding-right",12).css("padding-top","8px").find(".close-tab-page").hide();
								});
							});
							var liPageHtml = '<div class="LI-page" name="'+page.name+'"><iframe id="'+page.name+'" src="'+page.url+'"></iframe></div>';
							$(thisObj).append(liPageHtml);
							var height = $(thisObj).height() - 38;
							var width = $(thisObj).width()-12;
							$(thisObj).find(".LI-page").css("width",width+"px").css("height",height+"px").css("position","absolute").css("top","38px").css("left","6px").css("background-color","transparent");
							$(thisObj).find("li[name='"+page.name+"']").click(function(){
								$(thisObj).find(".LI-page").hide();
								$(thisObj).find(".LI-page[name="+page.name+"]").show();
								$(thisObj).find(".nav li a").removeClass("LI-on");
								$(thisObj).find(".nav li[name="+page.name+"] a").addClass("LI-on");
							});
							if(i==0){
								$(thisObj).find(".LI-on").removeClass("LI-on");
								$(thisObj).find(".nav li[name="+page.name+"] a").addClass("LI-on");
							}
							var length = $(thisObj).find(".nav").children().length;
							$(thisObj).selectTabPageByIndex(length-1);
						}else{
							$(thisObj).selectTabPage(pages[pages.length-1].name);
						}
					}
					
				}else{
					for(var i=0;i<pages.length;i++){
						if($(thisObj).find("li[name='"+pages[i].name+"']").length == 0){
							var page = pages[i];
							var liAreaHtml = '<li title='+page.title+' name='+page.name+' ><a href="javascript:void(0)"><span>'+page.title+'</span><span style="display:none;color:red;font-weight:400;font-family:arial;font-size:20px;position:relative;left:2px;top:-2px;" class="close-tab-page">×</span></a></li>';
							$(thisObj).find(".nav").append(liAreaHtml);
							$(thisObj).find("li[name='"+page.name+"'] .close-tab-page").click(function(){
								$(thisObj).deleteTabPage(page.name);
							});
							$(thisObj).find("li").each(function(){
								$(this).mouseover(function(){
									$(this).find("a").css("padding-left",6).css("padding-right",6).css("padding-top","7px").find(".close-tab-page").show();
								}).mouseout(function(){
									$(this).find("a").css("padding-left",12).css("padding-right",12).css("padding-top","8px").find(".close-tab-page").hide();
								});
							});
							var liPageHtml = '<div class="LI-page" name="'+page.name+'"><iframe id="'+page.name+'" src="'+page.url+'"></iframe></div>';
							$(thisObj).append(liPageHtml);
							var height = $(thisObj).height() - 30;
							var width = $(thisObj).width();
							$(thisObj).find(".LI-page").css("width",width+"px").css("height",height+"px").css("position","absolute").css("top","28px").css("left","0");
							$(thisObj).find("li[name='"+page.name+"']").click(function(){
								$(thisObj).find(".LI-page").hide();
								$(thisObj).find(".LI-page[name="+page.name+"]").show();
								$(thisObj).find(".nav li a").removeClass("LI-on");
								$(thisObj).find(".nav li[name="+page.name+"] a").addClass("LI-on");
							});
							if(i==0){
								$(thisObj).find(".LI-on").removeClass("LI-on");
								$(thisObj).find(".nav li[name="+page.name+"] a").addClass("LI-on");
							}
							var length = $(thisObj).find(".nav").children().length;
							$(thisObj).selectTabPageByIndex(length-1);
						}else{
							$(thisObj).selectTabPage(pages[pages.length-1].name);
						}
					}
				}
				
			return $(this);
		}
		$.fn.selectTabPage = function(name){
			var thisObj = $(this).get(0);
			$(thisObj).find(".LI-on").removeClass("LI-on");
			$(thisObj).find("li[name='"+name+"'] a").addClass("LI-on");
			$(thisObj).find(".LI-page").hide();
			$(thisObj).find(".LI-page[name='"+name+"']").show();
			return $(this);
		}
		$.fn.selectTabPageByIndex = function(index){
			var thisObj = $(this).get(0);
			$(thisObj).find(".LI-on").removeClass("LI-on");
			var array = thisObj.getElementsByTagName("li");
			$(array[index]).find("a").addClass("LI-on");
			var objName = $(array[index]).attr("name");
			$(thisObj).find(".LI-page").hide();
			$(thisObj).find(".LI-page[name='"+objName+"']").show();
		}
		$.fn.deleteTabPage = function(name){
			var thisObj = $(this).get(0);
			if(!isArray(name)){
				$(thisObj).find("li[name='"+name+"']").remove();
				$(thisObj).find(".LI-page[name='"+name+"']").remove();
				if($(thisObj).find(".LI-on").length == 0){
					$(thisObj).selectTabPageByIndex(0);
				}
			}else{
				var array = thisObj.getElementsByTagName("li");
				var objName = $(array[name]).attr("name");
				$(thisObj).deleteTabPage(objName);
			}
			return $(this);
		}
		
		//初始化弹出框
		$.fn.showPopoutWindow = function(){
			var thisObj = $(this).get(0);
			var Cls = $(thisObj).attr("class");
			if(Cls && Cls.indexOf("inited")>=0){
				if($(thisObj).find("iframe").length>0){
					var html = $(thisObj).find(".tan-chu-kuang-table-display-area").html();
					$(thisObj).find(".tan-chu-kuang-table-display-area").html("");
					$(thisObj).find(".tan-chu-kuang-table-display-area").html(html);
				}
				$(thisObj).slideDown("fast");
			}else{
				$(thisObj).initPopoutWindow();
				$(thisObj).slideDown("fast");
			}
			return $(this);
		}
		$.fn.closePopoutWindow = function(){
			$(this).hide();
		}
		$.fn.initPopoutWindow = function(param){
			var thisObj = $(this).get(0);
			if($(thisObj).find(".include").length<=0){
				var dataOptions = {};
				var title = "弹出窗";
				var width = 700;
				var height = 460;
				var left = 20;
				var top = 20;
				if($(thisObj).attr("data-options")){
					var dataOptionsStr = $(thisObj).attr("data-options");
					dataOptions = dataOptionsHandler(dataOptionsStr);
					title = dataOptions.title;
				}
				var buttons = dataOptions.buttons;
				if(dataOptions.buttons){
					dataOptions.buttons = window[buttons];
				}
				if(param){
					for(var index in param){
						dataOptions[index] = param[index];
					}
				}
				if(dataOptions.width){
					width = dataOptions.width;
				}
				if(dataOptions.height){
					height = dataOptions.height;
				}
				var oldHtml = $(thisObj).html();
				var html = "";
				html = html + '<div class="window-title">'+title+'</div>';
				html = html + '<div class="close-window-button"  id="close-window-button">×</div>';
				html = html + '<div class="tan-chu-kuang-table-display-area">';
				html = html + '</div>';
				$(thisObj).html(html);
				$(thisObj).find(".tan-chu-kuang-table-display-area").html(oldHtml);
				if(width<500)
					width = 500;
				if(dataOptions.fullScream && dataOptions.fullScream != "false"){
					left = 0;
					top = -30;
					width = 924;
					height = 567;
					$(thisObj).css("border-radius","0 0 17px 17px").css("background-color","#444");
					$(thisObj).css("z-index",50).css("width",width).css("height",height).css("top",top).css("left",left).css("position","absolute").css("overflow","hidden").css("box-shadow","0px 0px 5px 5px rgba(0,0,0,0.2)");
					$(thisObj).find("#close-window-button").css("left",$(thisObj).width()-30).css("top",30);
					$(thisObj).find(".tan-chu-kuang-table-display-area").css("height",height-82).css("padding-top",45).css("border-radius","0 0 17px 17px");
					var html = "";
					html = '<div class="popout-window-button-area"></div>';
					$(thisObj).append(html);
					$(thisObj).find(".popout-window-button-area").css("top",height-44).css("border-radius","0 0 12px 12px");
					html = "";
					//alert(dataOptions.buttons[0].text);
					if(dataOptions.buttons){
						for(var i=0;i<dataOptions.buttons.length;i++){
							html = '<div class="popout-window-button"><span class="icon '+dataOptions.buttons[i].type+'"></span>'+dataOptions.buttons[i].text+'</div>'+html;
						}
					}
					$(thisObj).find(".popout-window-button-area").html(html);
					if(dataOptions.buttons){
						for(var i=0;i<dataOptions.buttons.length;i++){
							$(thisObj).find(".popout-window-button-area").get(0).getElementsByTagName("div")[i].onclick = dataOptions.buttons[dataOptions.buttons.length-1-i].handler;
						}
					}
					$(".popout-window-button").mouseover(function(){
						$(this).addClass("popout-window-button-mouseover");
					}).mouseout(function(){
						$(this).removeClass("popout-window-button-mouseover");
					});
				}else{
					$(thisObj).css("border-radius","4px").css("background-color","#444");
					$(thisObj).css("z-index",50).css("width",width).css("height",height).css("top",top).css("left",left).css("position","absolute").css("overflow","hidden").css("box-shadow","0px 0px 5px 5px rgba(0,0,0,0.2)");
					$(thisObj).find("#close-window-button").css("left",$(thisObj).width()-30);
					$(thisObj).find(".tan-chu-kuang-table-display-area").css("height",height-75).css("width",$(thisObj).width());
					var html = "";
					html = '<div class="popout-window-button-area"></div>';
					$(thisObj).append(html);
					$(thisObj).find(".popout-window-button-area").css("top",height-30);
					html = "";
					//alert(dataOptions.buttons[0].text);
					if(dataOptions.buttons){
						for(var i=0;i<dataOptions.buttons.length;i++){
							html = '<div class="popout-window-button"><span class="icon '+dataOptions.buttons[i].type+'"></span>'+dataOptions.buttons[i].text+'</div>'+html;
						}
					}
					$(thisObj).find(".popout-window-button-area").html(html);
					if(dataOptions.buttons){
						for(var i=0;i<dataOptions.buttons.length;i++){
							$(thisObj).find(".popout-window-button-area").get(0).getElementsByTagName("div")[i].onclick = dataOptions.buttons[dataOptions.buttons.length-1-i].handler;
						}
					}
					$(".popout-window-button").mouseover(function(){
						$(this).addClass("popout-window-button-mouseover");
					}).mouseout(function(){
						$(this).removeClass("popout-window-button-mouseover");
					});
				}
				$(thisObj).find(".close-window-button").click(function(){
					$(thisObj).closePopoutWindow();
				});
				if(dataOptions && dataOptions.closeWindowHandler){
					if(isNaN(dataOptions.closeWindowHandler)){
						dataOptions.closeWindowHandler = window[dataOptions.closeWindowHandler];
					}
					$(thisObj).find(".close-window-button").bind("click",dataOptions.closeWindowHandler);
				}
				$(thisObj).setDropdown();
				closeAllDropdownWhenClickHTMLBody();

				$(thisObj).addClass("inited").hide();
				$(thisObj).find(".normal-input").setNormalInputAttr();
				$(thisObj).find(".read-only").setReadonlyInputAttr();
				$(thisObj).find(".dropdown").setSelectAttr();
				setInputTextStyle();
			}else{//iframe类------------------------------------------------------------------------------------------------------
				var dataOptions;
				var title = "弹出窗";
				var width = 700;
				var height = 460;
				var left = 20;
				var top = 20;
				if($(thisObj).attr("data-options")){
					var dataOptionsStr = $(this).attr("data-options");
					dataOptions = dataOptionsHandler(dataOptionsStr);
				}
				if(dataOptions.buttons){
					dataOptions.buttons = window[dataOptions.buttons];
				}
				if(param){
					for(var index in param){
						dataOptions[index] = param[index];
					}
				}
				if(dataOptions.width){
					width = dataOptions.width;
				}
				if(dataOptions.height){
					height = dataOptions.height;
				}
				if(dataOptions.title){
					title = dataOptions.title;
				}
				var includeObj = $(thisObj).find(".include").each(function(){
					var dataOptionsOfInclude = {};
					if($(this).attr("data-options")){
						var dataOptionsStr = $(this).attr("data-options");
						dataOptionsOfInclude = dataOptionsHandler(dataOptionsStr);
					}
					var url = "";
					if(dataOptionsOfInclude.url){
						url = dataOptionsOfInclude.url;
					}
					var html = "";
					html = html + '<div class="window-title">'+title+'</div>';
					html = html + '<div class="close-window-button"  id="close-window-button">×</div>';
					html = html + '<div class="tan-chu-kuang-table-display-area">';
					html = html + '</div>';
					$(thisObj).html(html);
					var iframeId = "iframe-in-"+$(thisObj).attr("id");
					html = '<iframe src="'+url+'" class="iframe-in-popout-window" id="'+iframeId+'"></iframe>';
					$(thisObj).find(".tan-chu-kuang-table-display-area").html(html);
					$(thisObj).find(".tan-chu-kuang-table-display-area").css("overflow","hidden").css("padding-top",0);
					$(thisObj).find(".tan-chu-kuang-table-display-area iframe").css("overflow","scroll");
				});
				if(width<500)
					width = 500;
				if(dataOptions.fullScream && dataOptions.fullScream != "false"){
					left = 0;
					top = -30;
					width = 924;
					height = 567;
					$(thisObj).css("border-radius","0 0 17px 17px").css("background-color","#444");
					$(thisObj).css("z-index",50).css("width",width).css("height",height).css("top",top).css("left",left).css("position","absolute").css("overflow","hidden").css("box-shadow","0px 0px 5px 5px rgba(0,0,0,0.2)");
					$(thisObj).find("#close-window-button").css("left",$(thisObj).width()-30).css("top",30);
					$(thisObj).find(".tan-chu-kuang-table-display-area").css("height",height-82).css("padding-top",45).css("border-radius","0 0 17px 17px");
					var html = "";
					html = '<div class="popout-window-button-area"></div>';
					$(thisObj).append(html);
					alert(height);
					$(thisObj).find(".popout-window-button-area").css("top",height-44).css("border-radius","0 0 12px 12px");
					html = "";
					//alert(dataOptions.buttons[0].text);
					if(dataOptions.buttons){
						for(var i=0;i<dataOptions.buttons.length;i++){
							html = '<div class="popout-window-button"><span class="icon '+dataOptions.buttons[i].type+'"></span>'+dataOptions.buttons[i].text+'</div>'+html;
						}
					}
					$(thisObj).find(".popout-window-button-area").html(html);
					if(dataOptions.buttons){
						for(var i=0;i<dataOptions.buttons.length;i++){
							$(thisObj).find(".popout-window-button-area").get(0).getElementsByTagName("div")[i].onclick = dataOptions.buttons[dataOptions.buttons.length-1-i].handler;
						}
					}
					$(".popout-window-button").mouseover(function(){
						$(this).addClass("popout-window-button-mouseover");
					}).mouseout(function(){
						$(this).removeClass("popout-window-button-mouseover");
					});
				}else{
					$(thisObj).css("border-radius","4px").css("background-color","#444");
					$(thisObj).css("z-index",50).css("width",width).css("height",height).css("top",top).css("left",left).css("position","absolute").css("overflow","hidden").css("box-shadow","0px 0px 5px 5px rgba(0,0,0,0.2)");
					$(thisObj).find("#close-window-button").css("left",$(thisObj).width()-30);
					$(thisObj).find(".tan-chu-kuang-table-display-area").css("height",height-60);
					var html = "";
					html = '<div class="popout-window-button-area"></div>';
					$(thisObj).append(html);
					$(thisObj).find(".popout-window-button-area").css("top",height-30);
					html = "";
					//alert(dataOptions.buttons[0].text);
					if(dataOptions.buttons){
						for(var i=0;i<dataOptions.buttons.length;i++){
							html = '<div class="popout-window-button"><span class="icon '+dataOptions.buttons[i].type+'"></span>'+dataOptions.buttons[i].text+'</div>'+html;
						}
					}
					$(thisObj).find(".popout-window-button-area").html(html);
					if(dataOptions.buttons){
						for(var i=0;i<dataOptions.buttons.length;i++){
							$(thisObj).find(".popout-window-button-area").get(0).getElementsByTagName("div")[i].onclick = dataOptions.buttons[dataOptions.buttons.length-1-i].handler;
						}
					}
					$(".popout-window-button").mouseover(function(){
						$(this).addClass("popout-window-button-mouseover");
					}).mouseout(function(){
						$(this).removeClass("popout-window-button-mouseover");
					});
				}
				$(thisObj).find(".close-window-button").click(function(){
					$(thisObj).closePopoutWindow();
				});
				if(dataOptions && dataOptions.closeWindowHandler){
					if(isNaN(dataOptions.closeWindowHandler)){
						dataOptions.closeWindowHandler = window[dataOptions.closeWindowHandler];
					}
					$(thisObj).find(".close-window-button").bind("click",dataOptions.closeWindowHandler);
				}
				$(thisObj).setDropdown();
				closeAllDropdownWhenClickHTMLBody();
				$(thisObj).find(".normal-input").setNormalInputAttr();
				$(thisObj).find(".read-only").setReadonlyInputAttr();
				$(thisObj).find(".dropdown").setSelectAttr();
				$(thisObj).addClass("inited").hide();
			}
			return $(this);
		}
		//form表单取值
		$.fn.getFormValue = function(){
			var thisObj = $(this).get(0);
			var valueArray = {};
			var requiredNameArray = {
					name:[],
					text:[]
			};
			$(thisObj).find(".value-displayer").each(function(){
				var value = "";
				if($(this).val()){
					value = $(this).val();
				}else{
					value = $(this).attr("value");
				}
				var name = "";
				var text = "";
				name = $(this).attr("name");
				text = $(this).prev().html();
				valueArray[name] = value;
				if($(this).attr("class").indexOf("required")>=0){
					requiredNameArray.name.push(name);
					requiredNameArray.text.push(text);
				}
			});
			var ifReturnValueArray = true;
			for(var i=0;i<requiredNameArray.name.length;i++){
				if(!valueArray[requiredNameArray.name[i]]){
					ifReturnValueArray = false;
				}
			}
			if(ifReturnValueArray){
				return valueArray;
			}else{
				alert('"'+requiredNameArray.text+'" 为必填项目，请完成填写!');
				return false;
			}
		}
		//获取datagrid中的checked元素
		$.fn.getChecked = function(columnId){
			var thisObj = $(this).get(0);
			var id = $(thisObj).attr("id");
			var checkBoxFor;
			var ifColumnIdEx = false;
			$(thisObj).find("tr").each(function(){
				var rowsId = $(this).attr("rowsid");
				//alert(rowsId);
				var obj = objArray[id][rowsId];
				checkBoxFor = $(this).children(".checkbox-TD").attr("checkboxfor");
				if(columnId && obj && obj[columnId]){
					ifColumnIdEx = true;
				}
				//alert("ifColumnIdEx="+ifColumnIdEx);
			});
			if(ifColumnIdEx == true){
				checkBoxFor = columnId;
			}else if(columnId){
				alert("getChecked 方法没有找到所指定的字段 ！");
				return false;
			}
			var array = [];
			$(thisObj).find("tr").each(function(){
				var rowsId = $(this).attr("rowsid");
				var checkboxId;
				if(rowsId)
					checkboxId = "checkbox_"+id+"_"+rowsId;
				//alert(rowsId);
				var checked = document.getElementById(checkboxId).checked;
				//alert(checked);
				if(checked && id && rowsId && checkBoxFor){
					var value = objArray[id][rowsId][checkBoxFor];
					array.push(value);
					//alert(checkboxId);
				}
			});
			//alert(array);
			return array;
		}
		//向DIV中的组件依次写入初始值的方法
		$.fn.initFormVal = function(valObj){
			var thisObj = $(this).get(0);
			$(thisObj).find(".value-displayer[name]").each(function(){
				var name = $(this).attr("name");
				if(valObj && valObj[name]){
					if($(this).parent().attr("class") && $(this).parent().attr("class").indexOf("dropdown")>=0){
						$(this).setSelectAttr("setvalue",valObj[name]);
					}else if($(this).attr("class") && $(this).attr("class").indexOf("read-only")>=0){
						$(this).setReadonlyInputAttr("setvalue",valObj[name]);
					}else if($(this).attr("class") && $(this).attr("class").indexOf("normal-input")>=0){
						$(this).setNormalInputAttr("setvalue",valObj[name]);
					}else if($(this).attr("type") && $(this).attr("type").indexOf("hidden")>=0){
						$(this).val(valObj[name]);
						$(this).attr("value",valObj[name]);
					}
				}
			});
			return $(this);
		}
		//清空DIV中的组件值
		$.fn.clearFormVal = function(){
			var thisObj = $(this).get(0);
			$(thisObj).find(".value-displayer[name]").each(function(){
				if($(this).parent().attr("class") && $(this).parent().attr("class").indexOf("dropdown")>=0){
					$(this).setSelectAttr("clear");
				}else if($(this).attr("class") && $(this).attr("class").indexOf("read-only")>=0){
					$(this).setReadonlyInputAttr("clear");
				}else if($(this).attr("class") && $(this).attr("class").indexOf("normal-input")>=0){
					$(this).setNormalInputAttr("clear");
				}else if($(this).attr("type") && $(this).attr("type").indexOf("hidden")>=0){
					$(this).val("");
					$(this).attr("value","");
				}
			});
			return $(this);
		}
		//判断变量是否是数组
		function isArray (array)
		{
			
			if ( array.constructor == window.Array )
			{
				return true;
			}
			else
			{
				return false;
			}
		}
		// 将元素中的 data-options 转换成 dataOptions 对象
			function dataOptionsHandler(str){
				var dataOptionsStr = str;
				var dataOptionsStrArray = dataOptionsStr.split(":");
				var dataOptions = {};
				for(var i=1;i<dataOptionsStrArray.length;i++){
					var j = i-1;
					var preArray = dataOptionsStrArray[j].split(",");
					var index = preArray[preArray.length-1].split("'")[0].split('"')[0];
					var thisArray = dataOptionsStrArray[i].split(",");
					if(i<dataOptionsStrArray.length-1){
						thisArray.pop();
					}
					for(var m=0;m<thisArray.length;m++){
						if(m==0){
							if(thisArray[m].indexOf("'")>=0){
								var strArray = thisArray[m].split("'");
								var str = strArray[1];
								thisArray[m] = str;
							}else if(thisArray[m].indexOf('"')>=0){
								var strArray = thisArray[m].split('"');
								var str = strArray[1];
								thisArray[m] = str;
							}
						}else{
							thisArray[m] = thisArray[m].split("'")[0].split('"')[0];
						}
					}
					var value = thisArray;
					if(value.length == 1 && index != "validtype"){
						value = value[0];
					}
					dataOptions[index] = value;
				}
				return dataOptions;
			}
	}(window.jQuery);

	//按钮样式控制
	function setButtonStyle(){
		$("#left-area-hide-button").mouseover(function(){
			$(this).removeClass("left-area-hide-button").addClass("left-area-hide-button-mouseover");
		}).mouseout(function(){
			$(this).removeClass("left-area-hide-button-mouseover").addClass("left-area-hide-button");
		}).mousedown(function(){
			$(this).removeClass("left-area-hide-button-mouseover").addClass("left-area-hide-button-mousedown");
		}).mouseup(function(){
			$(this).removeClass("left-area-hide-button-mousedown").addClass("left-area-hide-button-mouseover");
		});
		$(".tool-panel div,.tool-panel-in-popoutWindow div").each(function(){
			var obj = $(this);
			obj.mouseover(function(){
				obj.removeClass("tool-button").addClass("tool-button-mouseover");
			}).mouseout(function(){
				obj.removeClass("tool-button-mouseover").addClass("tool-button");
			}).mousedown(function(){
				obj.removeClass("tool-button-mouseover").addClass("tool-button-mousedown");
			}).mouseup(function(){
				obj.removeClass("tool-button-mousedown").addClass("tool-button-mouseover");
			});
		});
		$(".search-button-3").mouseover(function(){
			$(this).removeClass("search-button-3").addClass("search-button-3-mouseover");
		}).mouseout(function(){
			$(this).removeClass("search-button-3-mouseover").addClass("search-button-3");
		}).mousedown(function(){
			$(this).removeClass("search-button-3-mouseover").addClass("search-button-3-mousedown");
		}).mouseup(function(){
			$(this).removeClass("search-button-3-mousedown").addClass("search-button-3-mouseover");
		});
		$(".search-button-2").mouseover(function(){
			$(this).removeClass("search-button-2").addClass("search-button-2-mouseover");
		}).mouseout(function(){
			$(this).removeClass("search-button-2-mouseover").addClass("search-button-2");
		}).mousedown(function(){
			$(this).removeClass("search-button-2-mouseover").addClass("search-button-2-mousedown");
		}).mouseup(function(){
			$(this).removeClass("search-button-2-mousedown").addClass("search-button-2-mouseover");
		});
		$(".search-button-treegrid.html").mouseover(function(){
			$(this).removeClass("search-button-treegrid.html").addClass("search-button-treegrid.html-mouseover");
		}).mouseout(function(){
			$(this).removeClass("search-button-treegrid.html-mouseover").addClass("search-button-treegrid.html");
		}).mousedown(function(){
			$(this).removeClass("search-button-treegrid.html-mouseover").addClass("search-button-treegrid.html-mousedown");
		}).mouseup(function(){
			$(this).removeClass("search-button-treegrid.html-mousedown").addClass("search-button-treegrid.html-mouseover");
		});

		$(".login-button").mouseover(function(){
			$(this).removeClass("login-button").addClass("login-button-mouseover");
		}).mouseout(function(){
			$(this).removeClass("login-button-mouseover").addClass("login-button");
		}).mousedown(function(){
			$(this).removeClass("login-button-mouseover").addClass("login-button-mousedown");
		}).mouseup(function(){
			$(this).removeClass("login-button-mousedown").addClass("login-button-mouseover");
		});
		$("#userName-input-text").focus(function(){
			$("#userName-icon").css("background-color","#4c5cbb").css("border-color","#4c5cbb");
		}).blur(function(){
			$("#userName-icon").css("background-color","#eee").css("border-color","#eee");
		});
		$("#password-input-text").focus(function(){
			$("#password-icon").css("background-color","#4c5cbb").css("border-color","#4c5cbb");
		}).blur(function(){
			$("#password-icon").css("background-color","#eee").css("border-color","#eee");
		});
		$("#to-first-page").mouseover(function(){
			$(".icon-fast-backward").removeClass("icon-fast-backward").addClass("icon-fast-backward-hover");
		}).mouseout(function(){
			$(".icon-fast-backward-hover").removeClass("icon-fast-backward-hover").addClass("icon-fast-backward");
		});
		$("#to-last-page").mouseover(function(){
			$(".icon-fast-forward").removeClass("icon-fast-forward").addClass("icon-fast-forward-hover");
		}).mouseout(function(){
			$(".icon-fast-forward-hover").removeClass("icon-fast-forward-hover").addClass("icon-fast-forward");
		});
		$("#to-pre-page").mouseover(function(){
			$(".icon-chevron-left").removeClass("icon-chevron-left").addClass("icon-chevron-left-hover");
		}).mouseout(function(){
			$(".icon-chevron-left-hover").removeClass("icon-chevron-left-hover").addClass("icon-chevron-left");
		});
		$("#to-next-page").mouseover(function(){
			$(".icon-chevron-right").removeClass("icon-chevron-right").addClass("icon-chevron-right-hover");
		}).mouseout(function(){
			$(".icon-chevron-right-hover").removeClass("icon-chevron-right-hover").addClass("icon-chevron-right");
		});
		$("#submit-button,#reset-button").mouseover(function(){
			$(this).removeClass("submit-button").addClass("submit-button-mouseover");
		}).mouseout(function(){
			$(this).removeClass("submit-button-mouseover").addClass("submit-button");
		}).mousedown(function(){
			$(this).removeClass("submit-button-mouseover").addClass("submit-button-mousedown");
		}).mouseup(function(){
			$(this).removeClass("submit-button-mousedown").addClass("submit-button-mouseover");
		});
		$(".close-window-button").mouseover(function(){
			$(this).css("font-size","34px");
		}).mouseout(function(){
			$(this).css("font-size","30px");
		});
	}
	//标签页样式
	function setLiStyle(){
		$("#LI-group li").each(function(){
			var obj = $(this);
			obj.click(function(){
				var clsName = obj.attr("class");
				if(clsName != "active"){
					$("#LI-group .active").removeClass("active");
					obj.addClass("active");
				}
			});
		});
	}
	//设置搜索区域
	function setSearchArea(){
		var keywordArray = $("#search-keyword-area").children("div");
		var length = keywordArray.length;
		//alert(length);
		if(length>6){
			$(".search-panel").css("height","127px");
			$(".search-keyword-area").css("height","120px");
			$("#search-button").addClass("search-button-3").addClass("search-button");
			$(".table-panel").css("height","335px");
		}else if(length>3){
			$(".search-panel").css("height","90px");
			$(".search-keyword-area").css("overflow","hidden");
			$("#search-button").addClass("search-button-2").addClass("search-button");
			$(".table-panel").css("height","372px");
		}else{
			$(".search-panel").css("height","50px");
			$(".search-keyword-area").css("overflow","hidden");
			$("#search-button").addClass("search-button-treegrid.html").addClass("search-button");
			$(".table-panel").css("height","412px");
		}
		$(".search-name").each(function(){
			if($(this).html().length==6){
				$(this).css("font-size","11px");
			}else if($(this).html().length==7){
				$(this).css("font-size","10px");
			}else if($(this).html().length>7){
				$(this).css("font-size","9px");
			}
		});
	}
	//关闭弹出窗
	$(".close-window-button").click(function(){
		window.parent.$(".tan-chu-kuang,.zhe-zhao-ceng").hide();
		$(".search-name").css("border-color","#ccc").css("background-color","#eee").css("color","#333").css("text-shadow","0 1px 0 #fff");
		$(".tan-chu-kuang-input-group .btn-primary,.search-input-group .btn-primary").removeClass("btn-primary");
		$(".dropdown-menu").hide();
	});
	function add_button_function(){
		//alert(treegrid.html);
		$(".zhe-zhao-ceng").css("width",$(document).width()).css("height",$(document).height()).show();
		var window_height = $(window).height();
		var window_width = $(window).width();
		var scroll_top = $(window).scrollTop();
		var scroll_left = $(window).scrollLeft();
		var top = window_height/2 + scroll_top - 250;
		if(top<0){
			top=0;
		}
		var left = window_width/2 + scroll_left - 350;
		$(".dropdown-menu").hide();
		$(".tan-chu-kuang").css("top",top+"px").css("left",left+"px").slideDown("fast");
		
	}
	//input获得焦点样式
	function setInputTextStyle(){
		$("input[type=text],textarea").each(function(){
			var obj = $(this);
			//alert(obj.attr("class"));
			obj.focus(function(){
				$(".search-name,.textarea-group-treegrid.html-title,.textarea-group-2-title").css("border-color","#ccc").css("background-color","#eee").css("color","#333").css("text-shadow","0 1px 0 #fff");
				$(".tan-chu-kuang-input-group .btn-primary,.search-input-group .btn-primary").removeClass("btn-primary");
				$(".dropdown-menu").hide();
				obj.parent().children(".search-name,.textarea-group-treegrid.html-title,.textarea-group-2-title").css("border-color","#6654ea").css("background-color","#6654ea").css("color","white").css("text-shadow","0 0 0 #fff");
			}).blur(function(){
				obj.parent().children(".search-name").css("border-color","#ccc").css("background-color","#eee").css("color","#333").css("text-shadow","0 1px 0 #fff");
			});
		});
		$(".rowsInEveryPage,.jumpToPage").each(function(){
			var obj = $(this);
			//alert(obj.attr("class"));
			obj.focus(function(){
				$(".search-name").css("border-color","#ccc").css("background-color","#eee").css("color","#333").css("text-shadow","0 1px 0 #fff");
				$(".tan-chu-kuang-input-group .btn-primary,.search-input-group .btn-primary").removeClass("btn-primary");
				$(".dropdown-menu").hide();
				obj.parent().children("span").css("border-color","#383838").css("background-color","#383838").css("color","red").css("text-shadow","0 0 0 red");
			}).blur(function(){
				obj.parent().children("span").css("border-color","#ccc").css("background-color","#eee").css("color","#333").css("text-shadow","0 1px 0 #fff");
			});
		});
	}
	//绑定搜索栏下拉菜单
	$.fn.setDropdown = function(){
		$(this).find(".dropdown span,.dropdown .btn").each(function(){
			var obj = $(this);
			obj.click(function(){
				$(".search-name").css("border-color","#ccc").css("background-color","#eee").css("color","#333").css("text-shadow","0 1px 0 #fff");
				$(".tan-chu-kuang-input-group .btn-primary,.search-input-group .btn-primary").removeClass("btn-primary");
				//alert($(this).get(0));
				var parent_id = $(this).parent().attr("id");
				var index = parent_id.split("_")[1];
				//alert(parent_id);
				var dropdown_menu_id = "dropdown-menu_" + index;
				//alert(dropdown_menu_id);
				var top = $("#"+parent_id).offset().top + 23;
				var left = $("#"+parent_id).find(".search-name").offset().left;
				$("#"+parent_id).children(".btn").addClass("btn-primary");
				$("#"+parent_id).children(".search-name").css("border-color","#6654ea").css("background-color","#6654ea").css("color","white").css("text-shadow","0 0 0 #fff");
				if($("#"+dropdown_menu_id).css("display")=="none"){
					$(".dropdown-menu").hide();
					width = $("#"+parent_id).find(".search-name").width()+$("#"+parent_id).find(".value-displayer").width()+$("#"+parent_id).find(".btn").width()+40;
					$("#"+dropdown_menu_id).css("position","absolute").css("top",top+"px").css("left",left+"px").css("border-radius","0 0 6px 6px").css("width",width).slideDown("fast");
				}else{
					$("#"+dropdown_menu_id).hide();
				}
			});
			return $(this);
		});
		//单选
		if($(this).find(".dropdown-menu").length>0){
			$(this).find(".dropdown-menu li a.single-select-option").each(function(){
				var obj = $(this);
				obj.click(function(){
					var html = obj.html();
					var value = obj.attr("value");
					//alert(html);
					var index = obj.parent().parent().attr("id").split("_")[1];
					var parent_id = "select_" + index;
					$("#"+parent_id).children(".tan-chu-kuang-select,.search-select").html(html);
					$("#"+parent_id).children(".tan-chu-kuang-select,.search-select").attr("value",value);
					$("#"+parent_id).children(".btn").addClass("btn-primary");
					$("#"+parent_id).children(".search-name").css("border-color","#6654ea").css("background-color","#6654ea").css("color","white").css("text-shadow","0 0 0 #fff");
					$(".dropdown-menu").hide();
				});
			});
		}else if($(this).attr("class") && $(this).attr("class").indexOf("dorpdown-menu>=0")){
			$(this).find("li a.single-select-option").each(function(){
				var obj = $(this);
				obj.click(function(){
					var html = obj.html();
					var value = obj.attr("value");
					//alert(html);
					var index = obj.parent().parent().attr("id").split("_")[1];
					var parent_id = "select_" + index;
					$("#"+parent_id).children(".tan-chu-kuang-select,.search-select").html(html);
					$("#"+parent_id).children(".tan-chu-kuang-select,.search-select").attr("value",value);
					$("#"+parent_id).children(".btn").addClass("btn-primary");
					$("#"+parent_id).children(".search-name").css("border-color","#6654ea").css("background-color","#6654ea").css("color","white").css("text-shadow","0 0 0 #fff");
					$(".dropdown-menu").hide();
				});
			});
		}
		//多选取消按钮
		$(this).find(".dropdown-menu-multiple .btn-danger").each(function(){
			var obj = $(this);
			//alert(obj.attr("class"));
			obj.click(function(){
				$(this).parent().parent().parent().children(".btn").addClass("btn-primary");
				$(this).parent().parent().parent().children(".search-name").css("border-color","#6654ea").css("background-color","#6654ea").css("color","white").css("text-shadow","0 0 0 #fff");
				$(".dropdown-menu-multiple").hide();
			});
		});
		//多选确定按钮
		$(this).find(".dropdown-menu-multiple .btn-success").each(function(){
			var obj = $(this);
			var index = obj.parent().parent().attr("id").split("_")[1];
			var parent_id = "select_" + index;
			//alert(parent_id);
			obj.click(function(){
				var html = "";
				var value = "";
				//alert(this.className);
				var objArray=this.parentNode.parentNode.getElementsByTagName("input");
				var textArray=this.parentNode.parentNode.getElementsByTagName("label");
				for(var i=0;i<objArray.length;i++){
					//alert(objArray[i].checked);
					if(objArray[i].checked == true){
						if(html != ""){
							value = value + "," + objArray[i].value;
							html = html + "," + $(textArray[i]).html();
						}else{
							value = value + objArray[i].value;
							html = html + $(textArray[i]).html();
						}
					}
				}
				//alert(html);
				$("#"+parent_id).children(".tan-chu-kuang-select,.search-select").html(html);
				$("#"+parent_id).children(".tan-chu-kuang-select,.search-select").attr("value",value);
				$("#"+parent_id).children(".btn").addClass("btn-primary");
				$("#"+parent_id).children(".search-name").css("border-color","#6654ea").css("background-color","#6654ea").css("color","white").css("text-shadow","0 0 0 #fff");
				$(".dropdown-menu").hide();
			});
		});
	}
	$(".search-keyword-area,.tan-chu-kuang-table-display-area").scroll(function(){
		$(".dropdown-menu").hide();
	});
	//全选
	function set_select_all(id,selectAllInTabId){
		$("#"+id).click(function(){
			//alert(treegrid.html);
			var checked = this.checked;
			if(checked == false){
				//alert(treegrid.html);
				$("#"+selectAllInTabId+" .index-table-checkbox").each(function(){
					this.checked = false;
				});
			}else{
				//alert(2);
				$("#"+selectAllInTabId+" .index-table-checkbox").each(function(){
					this.checked = true;
				});
			}
		});
	}
	function uncheck_select_all(id,selectAllInTabId){
		$("#"+selectAllInTabId+" .index-table-checkbox").each(function(){
			alert(1);
			$(this).click(function(){
				var checked = this.checked;
				if(checked == false){
					$("#"+id).each(function(){
						this.checked = false;
					});
				}
			});	
		});
	}
		function my_alert(){
			alert("a");
		}
		function myAlert(){
			alert($(this).getObject().name);
		}
		function alertObj(obj){
			var id = $(obj).parent().parent().attr("id");
			var rows = objArray[id];
			var rowsId = $(obj).attr("rowsId");
			alert(rows[rowsId].id);
		}
	//当点击页面其他地方的时候，关闭下拉框
		function closeAllDropdownWhenClickHTMLBody(){
			$(".dropdown,.dropdown-menu").each(function(){
				$(this).click(function(event){
					event.stopPropagation();
				});
			});
			$("body").click(function(){
				$(".dropdown-menu").hide();
			});
		}
	//调整centerArea样式
	function setCenterAreaStyle(){
		var thisObj = $("#center-area").get(0);
		$(thisObj).css("width","942px").css("height","580px");
		$(thisObj).find(".LI-page").addClass("LI-page-in-center-area").css("width","923px").css("height","523px").css("top","38px").css("left","6px").css("background-color","transparent");
		$(thisObj).find(".LI-area").attr("id","LI-area");
	}
	//页面初始化方法
	function initPage(){
		setSearchArea();
		setButtonStyle();
		$(document).setDropdown();
		setLiStyle();
		setInputTextStyle();
		closeAllDropdownWhenClickHTMLBody();
		if($(".tab-page").length>0){
			$(".tab-page").initTabPage();
		}
	}
	//$(document).ready
	$(document).ready(function(){
		//alert(treegrid.html);
		$("table").each(function(){
			if(!$(this).attr("class") || $(this).attr("class").indexOf("table-condensed")<0)
				$(this).initTable();
		});
		setCenterAreaStyle();
		/*$(".num-only").keypress(function(event) {  
			var keyCode = event.which; 
			if (keyCode == 46 || (keyCode >= 48 && keyCode <=57) || keyCode == 8)  
				return true;  
			else  
				return false;  
		}).focus(function() {  
			this.style.imeMode='disabled';  
		});*/
		$(".normal-input").setNormalInputAttr();
		$(".read-only").setReadonlyInputAttr();
		$(".dropdown").setSelectAttr();
	});

	initPage();
