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
				async:false
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
						async:false
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
		checkBox:false
	};

	$(window).on('load', function(){
			$("table[class='treegrid']").each(function () {
			var $tgrid = $(this)
			, data = $tgrid.data('options');
			if(!data) return;
			$tgrid.treegrid((new Function("return {" + data + "}"))());
		});
	});

}(window.jQuery);