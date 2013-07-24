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
						async:false
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
				async:false
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
		}
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
		asyncUrl:null
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