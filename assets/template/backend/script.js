$(document).ready(function () {

    $('.select2').select2({
        placeholder: "Seleccione Proveedor"
    });

    $('#daterange-btn').daterangepicker(
      {
        locale: {
         format: 'DD/MM/YYYY' // --------Here
        },
        ranges   : {
          'Today'       : [moment(), moment()]
        }
      },
      function (start, end) {
        $('#daterange-btn span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'))
      }
    )
    
    var year = (new Date).getFullYear();
    datagrafico(base_url,year);

    $(document).on("click",".btn-cuentas", function(){
        cliente_id = $(this).val();
        $.ajax({
            url: base_url + "cuentas_cobrar/getCuentas/"+cliente_id,
            type:"POST",
            dataType: "json",
            success: function(data){
            	html = "";
            	var total =0;
                $.each(data, function(key, value){
                	html += "<tr>";
                	html += "<td><input type='hidden' name='cuentas[]' value='"+value.id+"'>"+value.serie + value.numero+"</td>"
                	html += "<td>"+value.fecha+"</td>"
                	html += "<td><input type='hidden' name='montos[]' value='"+value.total+"'>"+value.total+"</td>"
                	html += "<td><input type='hidden' name='pagados[]' value='"+value.pagado+"'>"+value.pagado+"</td>"
                	html += "</tr>";

                	total = total + (value.total - value.pagado);
                });
                $("#total").val(total.toFixed(2));
                $("#tbcuentas tbody").html(html);
            }
        });
    });

    $("#form-saldar-cuentas").submit(function(e){
        e.preventDefault();
        var dataForm = $(this).serialize();
        swal({
            title: "Estas seguro de saldar todas las cuentas?",
            type: "warning",
            showCancelButton: true,
            cancelButtonClass: "btn-danger",
            confirmButtonClass: "btn-success",
            confirmButtonText: "SI",
            cancelButtonText: "No",
            closeOnConfirm: true,
            closeOnCancel: true
        },
        function(isConfirm) {
            if (isConfirm) {
                $.ajax({
                    url: base_url + "cuentas_cobrar/saldarCuentas",
                    type: "POST",
                    data:dataForm,
                    success:function(resp){
                        if (resp == 1) {
                            swal({title: "Exito", text: "Se ha saldado todas las cuentas", type: "success"},
                               function(){ 
                                   window.location.reload();
                               }
                            );
                        }else{
                            swal("Error","No se pudo saldar las cuentas", "error");
                        }
                    }
                });
                
            } 
        });

    });

    $(document).on("click", ".btn-pagos", function(){
        nroFactura = $(this).closest("tr").find("td:eq(1)").text();
        $("#numero_factura").val(nroFactura);
        idCuenta = $(this).val();
        $.ajax({
            url: base_url + "cuentas_cobrar/getPagos/"+idCuenta,
            type:"POST",
            dataType: "json",
            success: function(data){
                html = "";
                $.each(data, function(key, value){
                    html += "<tr>";
                    html += "<td>"+value.monto+"</td>";
                    html += "<td>"+value.fecha+"</td>";
                    html += "</tr>";

                });

                $("#tbpagos tbody").html(html);
            }

        });
    });

    $(document).on("click", ".btn-abonar", function(){
        idCuenta = $(this).val();
        numeroComprobante = $(this).closest("tr").find("td:eq(1)").text();
        $("#modal-abonar .modal-title").text("Cuenta Abonar - "+numeroComprobante);
        $("#idCuenta").val(idCuenta);
        monto = $(this).closest("tr").find("td:eq(3)").text();
        pagado = $(this).closest("tr").find("td:eq(4)").text();
        $("#monto").val(monto);
        $("#pagado").val(pagado);
    });

    $(document).on("keyup mouseup", ".stocks_fisico", function(){
        stocks_fisico = Number($(this).val());
        precio_compra = $(this).closest("tr").find("td:eq(1)").text();
        stocks_bd = Number($(this).closest("tr").find("td:eq(2)").text());
        diferencia_stock = stocks_fisico-stocks_bd;
        importe = precio_compra*diferencia_stock;
        $(this).closest("tr").find("td:eq(4)").children('input').val(diferencia_stock);
        $(this).closest("tr").find("td:eq(5)").children('input').val(importe);
    });

    $("#comprobanteCompra").on("change", function(){
        var infocomprobante = $(this).val();
        var dataComprobante = infocomprobante.split("*");

        $("#idcomprobante").val(dataComprobante[0]);
        if (dataComprobante[1] == 1) {
            $("#proveedor").attr("required", "required");
        }else{
            $("#proveedor").removeAttr("required", "required");
        }
    });

    $("#btn-guardar-compra").on("click", function(){
        if ($("#tb-detalle-compra tbody tr").length == 0) {
            swal("Error", "Debe incluir al menos un producto en el detalle de compra", "error");
            return false;
        }
    });
    $("#searchProductoCompra").autocomplete({
        source:function(request, response){
            $.ajax({
                url: base_url+"movimientos/compras/getProductos",
                type: "POST",
                dataType:"json",
                data:{ valor: request.term},
                success:function(data){
                    response(data);
                }
            });
        },
        minLength:2,
        select:function(event, ui){
            
            html = "<tr>";
            html +="<td><input type='hidden' name='idproductos[]' value='"+ui.item.id+"'>"+ui.item.codigo+"</td>";
            html +="<td>"+ui.item.nombre+"</td>";
            html +="<td><input type='text' name='precios_compras[]' value='"+ui.item.precio_compra+"' style='width:70px;' class='precios-compras'></td>";
            html +="<td><input type='text' name='precios_ventas[]' value='"+ui.item.precio+"' style='width:70px;'></td>";
            html +="<td><input type='text' name='cantidades[]' value='1' style='width:70px;' min='1' class='cantidad-compra'></td>";
            html += "<td>";
            html +='<input type="hidden" name="importes[]" class="form-control"  value="'+ui.item.precio_compra+'">';
            html += '<p>'+ui.item.precio_compra+'</p>';
            html += "</td>";
            html +="<td><button type='button' class='btn btn-danger btn-remove-producto'><span class='fa fa-times'></span></button></td>";

            html +="</tr>"

            $("#tb-detalle-compra tbody").append(html);
            sumarCompra();
            
            this.value = "";
            return false;

        },
    });
    $('#searchProductoCompra').keypress(function(event){
        codigo_barra = $(this).val();

        if (event.which == '10' || event.which == '13') {
            
            
            $.ajax({
                url: base_url+"movimientos/compras/getProductoByCode",
                type: "POST",
                dataType:"json",
                data:{ codigo_barra: codigo_barra},
                success:function(data){
                
                    if (data =="0") {
                        swal({
                            position: 'center',
                            type: 'warning',
                            title: 'El codigo de barra no esta registrado o no cuenta con stock disponible',
                            showConfirmButton: false,
                            timer: 1500
                        });
                    }else{
                        html = "<tr>";
                        html +="<td><input type='hidden' name='idproductos[]' value='"+data.id+"'>"+data.codigo+"</td>";
                        html +="<td>"+data.nombre+"</td>";
                        html +="<td><input type='text' name='precios_compras[]' value='"+data.precio_compra+"'></td>";
                        html +="<td><input type='text' name='precios_ventas[]' value='"+data.precio+"'></td>";
                        html +="<td><input type='text' name='cantidades[]' value='1'></td>";
                        html +="<td><button type='button' class='btn btn-danger btn-remove-producto'><span class='fa fa-times'></span></button></td>";
                        html +="</tr>"

                        $("#tb-detalle-compra tbody").append(html);
                        
                    }
                    
                }
            });
            $('#searchProductoCompra').val(null);
            event.preventDefault();
        }
    });
    $(document).on("click", ".btn-anular", function(){
        var id = $(this).val();
        var modulo = 'compra';
        if ($("#modulo").val() == "ventas") {
            modulo = 'venta';
        }
        swal({
            title: "Estas seguro de anular la "+modulo+"?",
            type: "warning",
            showCancelButton: true,
            cancelButtonClass: "btn-danger",
            confirmButtonClass: "btn-success",
            confirmButtonText: "SI",
            cancelButtonText: "No",
            closeOnConfirm: true,
            closeOnCancel: true
        },
        function(isConfirm) {
            if (isConfirm) {
                $.ajax({
                    url: base_url + "movimientos/"+$("#modulo").val()+"/anular/"+id,
                    type: "POST",
                    data:{id: id},
                    dataType: 'json',
                    success:function(resp){
                        if (resp.status == "0") {
                            swal("Error", resp.message, "error");
                        }else{
                            
                            swal({title: "Exito", text: resp.message, type: "success"},
                               function(){ 
                                    if ($("#modulo").val() == "ventas") {
                                        $('#tbventas').dataTable().fnDraw();
                                    }else{
                                        $('#tbcompras').dataTable().fnDraw();
                                    }
                                    
                                    //table.ajax.reload();
                                   //window.location.reload();
                               }
                            );

                        }
                    }
                });
                
            } 
        });
    });

    $(document).on("click", ".btn-anular-venta-credito", function(){
        var id = $(this).val();
    
        swal({
            title: "Estas seguro de anular la venta al credito?",
            type: "warning",
            showCancelButton: true,
            cancelButtonClass: "btn-danger",
            confirmButtonClass: "btn-success",
            confirmButtonText: "SI",
            cancelButtonText: "No",
            closeOnConfirm: true,
            closeOnCancel: true
        },
        function(isConfirm) {
            if (isConfirm) {
                $.ajax({
                    url: base_url + "movimientos/ventas_creditos/anular/"+id,
                    type: "POST",
                    data:{id: id},
                    dataType: 'json',
                    success:function(resp){
                        if (resp.status == "0") {
                            swal("Error", resp.message, "error");
                        }else{
                            
                            swal({title: "Exito", text: resp.message, type: "success"},
                               function(){ 
                                    
                                        $('#tbventascreditos').dataTable().fnDraw();
                                    
                                    
                                    //table.ajax.reload();
                                   //window.location.reload();
                               }
                            );

                        }
                    }
                });
                
            } 
        });
    });
    $(document).on("keyup", "#monto-recibido", function(){
        var  montoRecibido = Number($(this).val());
        //numberformated = parseFloat(Math.round($(this).val() * 100) / 100).toFixed(2);
        //$(this).val(numberformated)
        
        var total = Number($("input[name=total]").val());
        cambio = montoRecibido - total;

        $("#cambio").val(cambio.toFixed(2));


    });
    $(document).on("click", "#btn-procesar-pendiente", function(){
        var venta = JSON.parse($(this).val());

        $("#idVentaPendiente").val(venta.id);
        $("#idcomprobante").val(venta.comprobante_id);
        if (venta.cliente_id != 0) {
            $("#idcliente").val(venta.cliente_id);
            $("#alert-success-rnc").show();

            html="<li>Razon Social: "+venta.razon_social+"</li>";
            html+="<li>RNC: "+venta.rnc+"</li>";
            $("#alert-success-rnc ul").html(html);
            $("#rnc").removeAttr("disabled");
            $("#rnc").val(venta.rnc);
        }
        html = "";
        $.each(venta.detalles,function(key, value){
            html += "<tr>";
            html += "<td><input type='hidden' name='productos[]' value='"+value.producto_id+"'>"+value.nombre+"</td>";
            html += '<td><input type="hidden" name="precios[]" class="form-control" value="'+value.precio+'">'+value.precio+'</td>';

            html += "<td>";
            html += '<div class="input-group">';
            html +='<span class="input-group-btn">'
            html +='<button class="btn btn-danger btn-menos btn-sm" type="button"><span class="fa fa-minus"></span></button></span>';
            html +='<input type="text" name="cantidades[]" class="form-control input-cantidad input-sm" value="'+value.cantidad+'">';
            html +='<span class="input-group-btn">'
            html +='<button class="btn btn-primary btn-mas btn-sm" type="button"><span class="fa fa-plus"></span></button></span></div></td>';
            html += "<td>";
            html +='<input type="hidden" name="importes[]" class="form-control"  value="'+value.importe+'">';
            html += '<p>'+value.importe+'</p>';
            html += "</td>";
            html += "<td><button type='button' class='btn btn-danger btn-sm btn-remove-producto'><span class='fa fa-remove'></span></button></td>";
            html += "</tr>";
            
        });

        $("#tborden tbody").html(html);

        $("input[name=total]").val(venta.monto);
        $(".total").text(venta.monto);

        $("#modal-lista-espera").modal("hide");
        $(".btn-guardar").removeAttr("disabled");
        $("#save-venta-pendiente").removeAttr("disabled");



    });
    $(document).on("click", "#save-venta-pendiente", function(){
        var attr = $("#rnc").attr('required');
        if (typeof attr !== typeof undefined && attr !== false && $("#idcliente").val() == '') {
            alert("El cliente no es valido");
            return false;
        }else{

            swal({
                title: "Numero de Mesa",
                type: "input",
                showCancelButton: true,
                closeOnConfirm: false,
                inputPlaceholder: "# de mesa"
            }, function (inputValue) {
                if (inputValue === false) return false;
                if (inputValue === "") {
                    swal.showInputError("Es necesario escribir el numero de mesa");
                    return false
                }
                var dataForm = $("#form-add-venta").serialize();

                
                $.ajax({
                    url: base_url + "movimientos/ventas/savePendiente",
                    type: "POST",
                    data: dataForm + "&numero_mesa="+inputValue,
                    success: function(resp){
                        if (resp=="0") {
                           swal("Error!", "No se pudo poner la venta en espera", "error");
                        }else{
                            swal({title: "Exito", text: "La venta en espera fue guardada", type: "success"},
                               function(){ 
                                   window.location.reload();
                               }
                            );
                        }
                    }
                });
            });
            
            

        }
    });
    $("#btn-save").on("click", function(){
        var attr = $("#rnc").attr('required');
        if (typeof attr !== typeof undefined && attr !== false && $("#idcliente").val() == '') {
            alert("El cliente no es valido");
            return false;
        }
    });
    $("#btn-save-venta-credito").on("click", function(){
        var attr = $("#cliente").attr('required');
        if (typeof attr !== typeof undefined && attr !== false && $("#idcliente").val() == '') {
            alert("El cliente no es valido");
            return false;
        }
    });
    $('#solicitar_cliente').on('change',function(){
        if($(this).is(':checked')){
            $(this).val('1');
        } else {
            $(this).val('0');
        }
    });
    $(document).on("keyup mouseup","#numero_inicial", function(){
        numero_inicial = $(this).val();

        $("#showNumeroInicial").val(zfill(numero_inicial,8));
    });

    $(document).on("keyup", "#rnc", function(){
        var rnc = $(this).val();
        if (rnc.length >= 8)  {
            $.ajax({
                url: base_url + "movimientos/ventas/searchRNC",
                type: 'POST',
                data:{rnc:rnc},
                dataType: 'json',
                success: function(data){
                    if (data == "0") {
                        $("#rnc").parent('div').removeClass("has-success");
                        $("#rnc").parent('div').find('span').removeClass("fa fa-check");
                        $("#rnc").parent('div').addClass("has-error");
                        $("#rnc").parent('div').find('span').addClass("fa fa-times");
                        $("#alert-success-rnc").hide();
                        $("#idcliente").val('');
                    } else {

                        $("#rnc").parent('div').removeClass("has-error");
                        $("#rnc").parent('div').find('span').removeClass("fa fa-times");
                        $("#rnc").parent('div').addClass("has-success");
                        $("#rnc").parent('div').find('span').addClass("fa fa-check");
                        $("#alert-success-rnc").show();
                        $("#idcliente").val(data.id);
                        html="<li>Razon Social: "+data.razon_social+"</li>";
                        html+="<li>RNC: "+data.rnc+"</li>";
                        $("#alert-success-rnc ul").html(html);
                    }
                }

            });
        }
        
    });

    $(document).on("keyup", "#cedula", function(){
        var cedula = $(this).val();
        if (cedula.length >= 6)  {
            $.ajax({
                url: base_url + "movimientos/ventas/searchCedula",
                type: 'POST',
                data:{cedula:cedula},
                dataType: 'json',
                success: function(data){
                    if (data == "0") {
                        $("#cedula").parent('div').removeClass("has-success");
                        $("#cedula").parent('div').find('span').removeClass("fa fa-check");
                        $("#cedula").parent('div').addClass("has-error");
                        $("#cedula").parent('div').find('span').addClass("fa fa-times");
                        $("#alert-success-cedula").hide();
                        $("#idcliente").val('');
                    } else {

                        $("#cedula").parent('div').removeClass("has-error");
                        $("#cedula").parent('div').find('span').removeClass("fa fa-times");
                        $("#cedula").parent('div').addClass("has-success");
                        $("#cedula").parent('div').find('span').addClass("fa fa-check");
                        $("#alert-success-cedula").show();
                        $("#idcliente").val(data.id);
                        html="<li>Nombres y Apellidos: "+data.nombres +" "+data.apellidos +"</li>";
                        html+="<li>Cedula: "+data.cedula+"</li>";
                        $("#alert-success-cedula ul").html(html);
                    }
                }

            });
        }
        
    });

    $(document).on("click", ".btn-mas", function(){
        precio = $(this).closest("tr").find("td:eq(1)").text();
        input = $(this).closest(".input-group").find("input");
        valorNuevo = Number(input.val()) + 1;

        input.val(valorNuevo);

        importe = valorNuevo * precio;
        $(this).closest("tr").find("td:eq(3)").children("p").text(importe.toFixed(2));
        $(this).closest("tr").find("td:eq(3)").children("input").val(importe.toFixed(2));
        sumar();
    });
    $(document).on("click", ".btn-menos", function(){
        precio = $(this).closest("tr").find("td:eq(1)").text();
        input = $(this).closest(".input-group").find("input");
        valorNuevo = Number(input.val()) - 1;

        if (valorNuevo == 0) {
            input.val('1');

            $(this).closest("tr").find("td:eq(3)").children("p").text(precio);
            $(this).closest("tr").find("td:eq(3)").children("input").val(precio);
            alert("No se puede reducir la cantidad menor a 1");
            /*swal({
                    position: 'center',
                    type: 'warning',
                    title: 'No se puede reducir la cantidad menor a 1',
                    showConfirmButton: false,
                    timer: 1500
                });*/
        }else{
            input.val(valorNuevo);
            importe = valorNuevo * precio;
            $(this).closest("tr").find("td:eq(3)").children("p").text(importe.toFixed(2));
            $(this).closest("tr").find("td:eq(3)").children("input").val(importe.toFixed(2));
        }
        sumar();
    });
    $('#searchProductoVenta').keypress(function(event){
        codigo_barra = $(this).val();

        if (event.which == '10' || event.which == '13') {
            
            
            $.ajax({
                url: base_url+"movimientos/ventas/getProductoByCode",
                type: "POST",
                dataType:"json",
                data:{ codigo_barra: codigo_barra},
                success:function(data){
                
                    if (data =="0") {
                    	alert("El codigo de barra no esta registrado o no cuenta con stock disponible");
                        /*swal({
                            position: 'center',
                            type: 'warning',
                            title: 'El codigo de barra no esta registrado o no cuenta con stock disponible',
                            showConfirmButton: false,
                            timer: 1500
                        });*/
                    }else{
                    	if (verificar(data.id)) {
		            		alert("El producto ya fue agregado");
		        		}else{
		        			html = "<tr>";
	                        html += "<td><input type='hidden' name='productos[]' value='"+data.id+"'>"+data.nombre+"</td>";
	                        html += '<td><input type="hidden" name="precios[]" class="form-control" value="'+data.precio+'">'+data.precio+'</td>';

                            html += "<td>";
                            html += '<div class="input-group">';
                            html +='<span class="input-group-btn">'
                            html +='<button class="btn btn-danger btn-menos btn-sm" type="button"><span class="fa fa-minus"></span></button></span>';
                            html +='<input type="text" name="cantidades[]" class="form-control input-cantidad input-sm" value="1">';
                            html +='<span class="input-group-btn">'
                            html +='<button class="btn btn-primary btn-mas btn-sm" type="button"><span class="fa fa-plus"></span></button></span></div></td>';
	                        html += "<td>";
	                        html +='<input type="hidden" name="importes[]" class="form-control"  value="'+data.precio+'">';
	                        html += '<p>'+data.precio+'</p>';
	                        html += "</td>";
	                        html += "<td><button type='button' class='btn btn-danger btn-sm btn-remove-producto'><span class='fa fa-remove'></span></button></td>";
	                        html += "</tr>";

	                        $("#tborden tbody").append(html);
	                        $(".btn-guardar").removeAttr("disabled");
                            $("#save-venta-pendiente").removeAttr("disabled");


	                        sumar();
	                        if (Number($("input[name=total]").val()) != 0) {
	                            $("#tborden tbody tr.message").remove();
	                        }
		        		}
                       
                    }
                    
                }
            });
            $('#searchProductoVenta').val(null);
            event.preventDefault();
        }
    });
    $(document).on("click", ".btn-selected", function(){
        valorBtn = $(this).val();
        infoBtn = valorBtn.split("*");

        if (verificar(infoBtn[0])) {
            alert("El producto ya fue agregado");
        }else{

            html = "<tr>";
            html += "<td><input type='hidden' name='productos[]' value='"+infoBtn[0]+"'>"+infoBtn[2]+"</td>";
            html += '<td><input type="hidden" name="precios[]" class="form-control" value="'+infoBtn[3]+'">'+infoBtn[3]+'</td>';
            html += "<td>";
            html += '<div class="input-group">';
            html +='<span class="input-group-btn">'
            html +='<button class="btn btn-danger btn-menos btn-sm" type="button"><span class="fa fa-minus"></span></button></span>';
            html +='<input type="text" name="cantidades[]" class="form-control input-cantidad input-sm" value="1">';
            html +='<span class="input-group-btn">'
            html +='<button class="btn btn-primary btn-mas btn-sm" type="button"><span class="fa fa-plus"></span></button></span></div></td>';
            html += "</td>";
            html += "<td>";
            html +='<input type="hidden" name="importes[]" class="form-control"  value="'+infoBtn[3]+'">';
            html += '<p>'+infoBtn[3]+'</p>';
            html += "</td>";
            html += "<td><button type='button' class='btn btn-danger btn-sm btn-remove-producto'><span class='fa fa-remove'></span></button></td>";
            html += "</tr>";

            $("#tborden tbody").append(html);
            $(".btn-guardar").removeAttr("disabled");
            $("#save-venta-pendiente").removeAttr("disabled");
            
            sumar();

            if (Number($("input[name=total]").val()) != 0) {
                $("#tborden tbody tr.message").remove();
            }

        }

        
    });
    $(document).on("click",".btn-check",function(){
        cliente = $(this).val();
        infocliente = cliente.split("*");
        $("#infoCliente").val(infocliente[4] + ' - ' +infocliente[1]);
        $("#idCliente").val(infocliente[0]);
        $("#modal-clientes").modal("hide");
    });
    $("#categoria").on("change", function(){
        id = $(this).val(); 
        $.ajax({
            url: base_url + "movimientos/ventas/getProductosByCategoria",
            type: "POST", 
            data:{idcategoria:id},
            dataType:"json",
            success:function(resp){
                html = "";
                $.each(resp,function(key, value){

                    if (value.condicion == "1") {
                        stock = value.stock;
                    }
                    else{
                        stock = "N/A";
                    }
                    data = value.id + "*"+ value.codigo+ "*"+ value.nombre+ "*"+ value.precio+ "*"+ stock;
                    html += "<tr>";
                    html += "<td><img src='"+base_url+"/assets/images/productos/"+value.imagen+"' width='50' height='50'></td>";
                    html += "<td>"+value.nombre+"</td>";
                    html += "<td><button type='button' class='btn btn-success btn-flat btn-selected' value='"+data+"'><span class='fa fa-check'></span></button></td>";
                    html += "</tr>";
                });

                $("#tb-productos tbody").html(html);
            }

        });
    });
    $("#year").on("change",function(){
        yearselect = $(this).val();
        datagrafico(base_url,yearselect);
    });
    $(".btn-remove").on("click", function(e){
        e.preventDefault();
        var ruta = $(this).attr("href");
        //alert(ruta);
        $.ajax({
            url: ruta,
            type:"POST",
            success:function(resp){
                //http://localhost/ventas_ci/mantenimiento/productos
                window.location.href = base_url + resp;
            }
        });
    });
    $(document).on("click",".btn-view-producto", function(){
        var producto = $(this).val(); 
        //alert(cliente);
        var infoproducto = producto.split("*");
        html = "<p><strong>Codigo:</strong>"+infoproducto[1]+"</p>"
        html += "<p><strong>Nombre:</strong>"+infoproducto[2]+"</p>"
        html += "<p><strong>Descripcion:</strong>"+infoproducto[3]+"</p>"
        html += "<p><strong>Precio Compra:</strong>"+infoproducto[4]+"</p>"
        html += "<p><strong>Precio Venta:</strong>"+infoproducto[5]+"</p>"
        html += "<p><strong>Stock:</strong>"+infoproducto[6]+"</p>"
        html += "<p><strong>Categoria:</strong>"+infoproducto[7]+"</p>";
        srcImage = base_url + "assets/images/productos/" + infoproducto[8];
        $("#detalle-producto").html(html);
        $("#image-product").attr('src', srcImage);
    });

    $(document).on("click",".btn-view-proveedor", function(){
        var proveedor = $(this).val(); 
        //alert(proveedor);
        var infoproveedor = proveedor.split("*");
        html = "<p><strong>RNC:</strong>"+infoproveedor[1]+"</p>"
        html += "<p><strong>Razon Social:</strong>"+infoproveedor[2]+"</p>"
        $("#modal-default .modal-body").html(html);
    });
  
    $(document).on("click",".btn-view-cliente-juridico", function(){
        var cliente = $(this).val(); 
        //alert(cliente);
        var infocliente = cliente.split("*");
        html = "<p><strong>RNC:</strong>"+infocliente[1]+"</p>"
        html += "<p><strong>Razon Social:</strong>"+infocliente[2]+"</p>"
        $("#modal-default .modal-body").html(html);
    });

    $(document).on("click",".btn-view-categoria", function(){
        var categoria = $(this).val(); 
        //alert(cliente);
        var infocategoria = categoria.split("*");
        html = "<p><strong>Nombre:</strong>"+infocategoria[1]+"</p>"
        html += "<p><strong>Descripcion:</strong>"+infocategoria[2]+"</p>"
        $("#modal-default .modal-body").html(html);
    });

    $(document).on("click",".btn-view-cliente-normal", function(){
        var cliente = $(this).val(); 
        //alert(cliente);
        var infocliente = cliente.split("*");
        html = "<p><strong>Cedula:</strong>"+infocliente[1]+"</p>"
        html += "<p><strong>Nombres:</strong>"+infocliente[2]+"</p>"
        html += "<p><strong>Apellidos:</strong>"+infocliente[3]+"</p>"
        html += "<p><strong>Telefono:</strong>"+infocliente[4]+"</p>"
        html += "<p><strong>Celular:</strong>"+infocliente[5]+"</p>"
        html += "<p><strong>Correo:</strong>"+infocliente[6]+"</p>"
        html += "<p><strong>Direccion:</strong>"+infocliente[7]+"</p>"
        $("#modal-default .modal-body").html(html);
    });
    $(".btn-view").on("click", function(){
        var id = $(this).val();
        $.ajax({
            url: base_url + "mantenimiento/categorias/view/" + id,
            type:"POST",
            success:function(resp){
                $("#modal-default .modal-body").html(resp);
                //alert(resp);
            }

        });

    });
    $(".btn-view-usuario").on("click", function(){
        var id = $(this).val();
        $.ajax({
            url: base_url + "administrador/usuarios/view",
            type:"POST",
            data:{idusuario:id},
            success:function(resp){
                $("#modal-default .modal-body").html(resp);
                //alert(resp);
            }

        });

    });
    $('#example').DataTable( {
        dom: 'Bfrtip',
        buttons: [
            {
                extend: 'excelHtml5',
                title: "Listado de Ventas",
                exportOptions: {
                    columns: [ 0, 1,2, 3, 4, 5 ]
                },
            },
            {
                extend: 'pdfHtml5',
                title: "Listado de Ventas",
                exportOptions: {
                    columns: [ 0, 1,2, 3, 4, 5 ]
                }
                
            }
        ],

        language: {
            "lengthMenu": "Mostrar _MENU_ registros por pagina",
            "zeroRecords": "No se encontraron resultados en su busqueda",
            "searchPlaceholder": "Buscar registros",
            "info": "Mostrando registros de _START_ al _END_ de un total de  _TOTAL_ registros",
            "infoEmpty": "No existen registros",
            "infoFiltered": "(filtrado de un total de _MAX_ registros)",
            "search": "Buscar:",
            "paginate": {
                "first": "Primero",
                "last": "Último",
                "next": "Siguiente",
                "previous": "Anterior"
            },
        }
    });
    $(document).ready(function () {
        var f = new Date();
        $('#tbcierre').DataTable({
            dom: 'Bfrtip',
            buttons: [
                {
                    extend: 'print',
                    title: "<center>LISTADO DE PRODUCTOS VENDIDOS DEL DIA " + "<br>" + $("#dateSelected").val() +"</center>",
                    exportOptions: {
                        columns: [ 0, 1,2, 3, 4]
                    },
                    footer: true 
                },
            ],
            language: tradutorDataTables(),
            order: [[ 4, "asc" ],[0,"asc"]]
        });
    })

    $(document).ready(function () {
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();
        $('#tb-inventario-fisico').DataTable({
            dom: 'Bfrtip',
            buttons: [
                {
                    extend: 'print',
                    title: "INVENTARIO FISICO - "+dd + '/' + mm + '/' + yyyy,
                    exportOptions: {
                        columns: [ 0, 1,2, 3]
                    },
                    footer: true,
                    customize: function ( win ) {
                        $(win.document.body).find('h1').css('text-align', 'center');
                        $(win.document.body).css('height', 'auto');
                    }
                },
            ],
            language: tradutorDataTables(),
            order: [[ 1, "asc" ],[0,"asc"]]
        });
    })

    $(document).ready(function () {
        
        $('#tb-abonos').DataTable({
            dom: 'Bfrtip',
            buttons: [
                {
                    extend: 'print',
                    title: "Reporte de Abonos",
                    exportOptions: {
                        columns: [ 0, 1,2, 3,4]
                    },
                    footer: true,
                    customize: function ( win ) {
                        $(win.document.body).find('h1').css('text-align', 'center');
                        $(win.document.body).css('height', 'auto');
                    },
                },
            ],
            language: tradutorDataTables(),
            order: [[ 1, "asc" ],[0,"asc"]]
        });
    })

    $(document).ready(function () {
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();
        $('#tb-inventario-contable').DataTable({
            dom: 'Bfrtip',
            buttons: [
                {
                    extend: 'print',
                    title: "INVENTARIO CONTABLE - "+dd + '/' + mm + '/' + yyyy,
                    exportOptions: {
                        columns: [ 0, 1,2, 3,4,5]
                    },
                    footer: true,
                    customize: function ( win ) {
                        $(win.document.body).find('h1').css('text-align', 'center');
                        $(win.document.body).css('height', 'auto');
                    },
                },
            ],
            language: tradutorDataTables(),
            order: [[ 1, "asc" ],[0,"asc"]]
        });
    })
 
	$('#example1').DataTable({
        "language": {
            "lengthMenu": "Mostrar _MENU_ registros por pagina",
            "zeroRecords": "No se encontraron resultados en su busqueda",
            "searchPlaceholder": "Buscar registros",
            "info": "Mostrando registros de _START_ al _END_ de un total de  _TOTAL_ registros",
            "infoEmpty": "No existen registros",
            "infoFiltered": "(filtrado de un total de _MAX_ registros)",
            "search": "Buscar:",
            "paginate": {
                "first": "Primero",
                "last": "Último",
                "next": "Siguiente",
                "previous": "Anterior"
            },
        }
    });
    $('.example1').DataTable({
        "language": {
            "lengthMenu": "Mostrar _MENU_ registros por pagina",
            "zeroRecords": "No se encontraron resultados en su busqueda",
            "searchPlaceholder": "Buscar registros",
            "info": "Mostrando registros de _START_ al _END_ de un total de  _TOTAL_ registros",
            "infoEmpty": "No existen registros",
            "infoFiltered": "(filtrado de un total de _MAX_ registros)",
            "search": "Buscar:",
            "paginate": {
                "first": "Primero",
                "last": "Último",
                "next": "Siguiente",
                "previous": "Anterior"
            },
        }
    });

    $(document).ready(function () {
        $('#clients').DataTable({
            "processing": true,
            "serverSide": true,
            "ajax":{
                "url": base_url + "mantenimiento/clients/getClients",
                "dataType": "json",
                "type": "POST",
                "data":{  '<?php echo $this->security->get_csrf_token_name(); ?>' : '<?php echo $this->security->get_csrf_hash(); ?>' }
            },
            "columns": [
                { "data": "id" },
                { "data": "rnc" },
                { "data": "razon_social" },
                {
                    mRender: function (data, type, row) {
                        var valueBtnView = row.id + "*" + row.rnc + "*" + row.razon_social;
                        var btnView = '<button class="btn btn-primary" value="'+valueBtnView+'"><span class="fa fa-eye"></span></button>';
                        var btnEdit = '<a class="btn btn-warning" href="' + base_url+"mantenimiento/clients/"+ row.id + '"><span class="fa fa-pencil"></span></a>';
                        return btnView +" "+btnEdit;
                    }
                } 
            ],
            "language": {
                "lengthMenu": "Mostrar _MENU_ registros por pagina",
                "zeroRecords": "No se encontraron resultados en su busqueda",
                "searchPlaceholder": "Buscar registros",
                "info": "Mostrando registros de _START_ al _END_ de un total de  _TOTAL_ registros",
                "infoEmpty": "No existen registros",
                "infoFiltered": "(filtrado de un total de _MAX_ registros)",
                "search": "Buscar:",
                "paginate": {
                    "first": "Primero",
                    "last": "Último",
                    "next": "Siguiente",
                    "previous": "Anterior"
                },
            }    

        });
    });
    $(document).ready(function () {
        $('#tbclientesnormales').DataTable({
            "processing": true,
            "serverSide": true,
            "ajax":{
                "url": base_url + "mantenimiento/clientes_normales/getClientesNormales",
                "dataType": "json",
                "type": "POST",
                "data":{  '<?php echo $this->security->get_csrf_token_name(); ?>' : '<?php echo $this->security->get_csrf_hash(); ?>' }
            },
            "columns": [
                { "data": "id" },
                { "data": "cedula" },
                { "data": "nombres" },
                { "data": "apellidos" },
                { "data": "telefono" },
                { "data": "celular" },
                { "data": "correo" },
                { "data": "direccion" },
                {
                    mRender: function (data, type, row) {
                        var valueBtnView = row.id + "*" + row.cedula + "*" + row.nombres+ "*" + row.apellidos+ "*" + row.telefono+ "*" + row.celular+ "*" + row.correo+ "*" + row.direccion ;
                        var btnView = '<button class="btn btn-primary btn-view-cliente-normal" value="'+valueBtnView+'" data-toggle="modal" data-target="#modal-default"><span class="fa fa-eye"></span></button>';
                        var btnEdit = '<a class="btn btn-warning" href="' + base_url+"mantenimiento/clientes_normales/edit/"+ row.id + '"><span class="fa fa-pencil"></span></a>';
                        return btnView +" "+btnEdit;
                    }
                } 
            ],
            "language": tradutorDataTables() 

        });
    });

    $(document).ready(function () {
        $('#tbclientesjuridicos').DataTable({
            "processing": true,
            "serverSide": true,
            "ajax":{
                "url": base_url + "mantenimiento/clientes_juridicos/getClientesJuridicos",
                "dataType": "json",
                "type": "POST",
                "data":{  '<?php echo $this->security->get_csrf_token_name(); ?>' : '<?php echo $this->security->get_csrf_hash(); ?>' }
            },
            "columns": [
                { "data": "id" },
                { "data": "rnc" },
                { "data": "razon_social" },
                {
                    mRender: function (data, type, row) {
                        var valueBtnView = row.id + "*" + row.rnc + "*" + row.razon_social;
                        var btnView = '<button class="btn btn-primary btn-view-cliente-juridico" value="'+valueBtnView+'" data-toggle="modal" data-target="#modal-default"><span class="fa fa-eye"></span></button>';
                        var btnEdit = '<a class="btn btn-warning" href="' + base_url+"mantenimiento/clientes_juridicos/edit/"+ row.id + '"><span class="fa fa-pencil"></span></a>';
                        return btnView +" "+btnEdit;
                    }
                } 
            ],
            "language": tradutorDataTables() 

        });
    });

    function tradutorDataTables(){
        return {
                "lengthMenu": "Mostrar _MENU_ registros por pagina",
                "zeroRecords": "No se encontraron resultados en su busqueda",
                "searchPlaceholder": "Buscar registros",
                "info": "Mostrando registros de _START_ al _END_ de un total de  _TOTAL_ registros",
                "infoEmpty": "No existen registros",
                "infoFiltered": "(filtrado de un total de _MAX_ registros)",
                "search": "Buscar:",
                "paginate": {
                    "first": "Primero",
                    "last": "Último",
                    "next": "Siguiente",
                    "previous": "Anterior"
                },
            };
    }

    $(document).ready(function () {
        $('#tbproveedores').DataTable({
            "processing": true,
            "serverSide": true,
            "ajax":{
                "url": base_url + "mantenimiento/proveedores/getProveedores",
                "dataType": "json",
                "type": "POST",
                "data":{  '<?php echo $this->security->get_csrf_token_name(); ?>' : '<?php echo $this->security->get_csrf_hash(); ?>' }
            },
            "columns": [
                { "data": "id" },
                { "data": "rnc" },
                { "data": "razon_social" },
                {
                    mRender: function (data, type, row) {
                        var valueBtnView = row.id + "*" + row.rnc + "*" + row.razon_social;
                        var btnView = '<button class="btn btn-primary btn-view-proveedor" value="'+valueBtnView+'" data-toggle="modal" data-target="#modal-default"><span class="fa fa-eye"></span></button>';
                        var btnEdit = '<a class="btn btn-warning" href="' + base_url+"mantenimiento/proveedores/edit/"+ row.id + '"><span class="fa fa-pencil"></span></a>';
                        return btnView +" "+btnEdit;
                    }
                } 
            ],
            "language": tradutorDataTables()   

        });
    });

    $(document).ready(function () {
        $('#tbcategorias').DataTable({
            "processing": true,
            "serverSide": true,
            "ajax":{
                "url": base_url + "mantenimiento/categorias/getCategorias",
                "dataType": "json",
                "type": "POST",
                "data":{  '<?php echo $this->security->get_csrf_token_name(); ?>' : '<?php echo $this->security->get_csrf_hash(); ?>' }
            },
            "columns": [
                { "data": "id" },
                { "data": "nombre" },
                { "data": "descripcion" },
                {
                    mRender: function (data, type, row) {
                        var valueBtnView = row.id + "*" + row.nombre + "*" + row.descripcion;
                        var btnView = '<button class="btn btn-primary btn-view-categoria" value="'+valueBtnView+'" data-toggle="modal" data-target="#modal-default"><span class="fa fa-eye"></span></button>';
                        var btnEdit = '<a class="btn btn-warning" href="' + base_url+"mantenimiento/categorias/edit/"+ row.id + '"><span class="fa fa-pencil"></span></a>';
                        return btnView +" "+btnEdit;
                    }
                } 
            ],
            "language": tradutorDataTables()   

        });
    });

    $(document).ready(function () {
        $('#tbproductos').DataTable({
            "processing": true,
            "serverSide": true,
            "ajax":{
                "url": base_url + "mantenimiento/productos/getProductos",
                "dataType": "json",
                "type": "POST",
                "data":{  '<?php echo $this->security->get_csrf_token_name(); ?>' : '<?php echo $this->security->get_csrf_hash(); ?>' }
            },
            "columns": [
                { "data": "id" },
                { "data": "codigo" },
                { "data": "nombre" },
                { "data": "descripcion" },
                { "data": "precio_compra" },
                { "data": "precio" },
                { "data": "stock" },
                { "data": "categoria" },
                {
                    mRender: function (data, type, row) {
                        var valueBtnView = row.id + "*" + row.codigo + "*" + row.nombre + "*" + row.descripcion+ "*" + row.precio_compra+ "*" + row.precio+ "*" + row.stock+ "*" + row.categoria+"*"+row.imagen;
                        var btnView = '<button class="btn btn-primary btn-view-producto" value="'+valueBtnView+'" data-toggle="modal" data-target="#modal-default"><span class="fa fa-eye"></span></button>';
                        var btnEdit = '<a class="btn btn-warning" href="' + base_url+"mantenimiento/productos/edit/"+ row.id + '"><span class="fa fa-pencil"></span></a>';
                        return btnView +" "+btnEdit;
                    }
                } 
            ],
            "language": tradutorDataTables()  

        });
    });
    $(document).ready(function () {
        $('#tbcompras').DataTable({
            "processing": true,
            "serverSide": true,
            "ajax":{
                "url": base_url + "movimientos/compras/getComprasAll",
                "dataType": "json",
                "type": "POST",
                "data":{  '<?php echo $this->security->get_csrf_token_name(); ?>' : '<?php echo $this->security->get_csrf_hash(); ?>' }
            },
            "columns": [
                { "data": "id" },
                { "data": "numero_comprobante" },
                { "data": "numero_factura" },
                { "data": "comprobante" },
                { "data": "proveedor" },
                { "data": "fecha" },
                { "data": "tipo_pago" },
                { "data": "total" },
                { "data": "estado",
                    fnCreatedCell: function (nTd, sData, oData, iRow, iCol) {
                        if (oData.estado == 0) {
                            html = '<span class="label label-danger">Anulada</span>';
                        }else{
                            html = '<span class="label label-success">Procesada</span>';
                        }
                        $(nTd).html(html);
                    }
                },
                {
                    mRender: function (data, type, row) {
                        var btnView = '<button class="btn btn-info btn-view-compra" value="'+row.id+'" data-toggle="modal" data-target="#modal-compra"><span class="fa fa-eye"></span></button>';

                        var btnEdit = '<a class="btn btn-warning" href="' + base_url+"movimientos/compras/edit/"+ row.id + '"><span class="fa fa-pencil"></span></a>';
                        var btnDelete = '<button class="btn btn-danger btn-anular" value="'+row.id+'"><span class="fa fa-times"></span></button>';
                        var btnPrint = '<a class="btn btn-primary" href="' + base_url+"movimientos/compras/printCompra/"+ row.id + '"><span class="fa fa-print"></span></a>';

                        if (row.estado == 0) {
                            return btnView;
                        }
                        return btnView +' '+ btnEdit + ' ' + btnDelete + ' '+btnPrint;
                    }
                } 
            ],
            "language": tradutorDataTables()  

        });
    });

    $(document).ready(function () {
        $('#tbventas').DataTable({
            "processing": true,
            "serverSide": true,
            "ajax":{
                "url": base_url + "movimientos/ventas/getVentasAll",
                "dataType": "json",
                "type": "POST",
                "data":{  '<?php echo $this->security->get_csrf_token_name(); ?>' : '<?php echo $this->security->get_csrf_hash(); ?>' }
            },
            "columns": [
                { "data": "id" },
                { "data": "numero" },
                { "data": "comprobante" },
                { "data": "nombre_cliente" },
                { "data": "rnc" },
                { "data": "fecha" },
                { "data": "total" },
                { "data": "estado",
                    fnCreatedCell: function (nTd, sData, oData, iRow, iCol) {
                        if (oData.estado == 0) {
                            html = '<span class="label label-danger">Anulada</span>';
                        }else{
                            html = '<span class="label label-success">Procesada</span>';
                        }
                        $(nTd).html(html);
                    }
                },
                { "data": "usuario" },
                {
                    mRender: function (data, type, row) {
                        var permisos = JSON.parse($("#permisos").val());
                        var btnView = '<button class="btn btn-info btn-sm btn-view-venta" value="'+row.id+'" data-toggle="modal" data-target="#modal-default"><span class="fa fa-eye"></span></button>';
                        var btnEdit = '';
                        if (permisos.update == 1) {
                            btnEdit = '<a class="btn btn-warning btn-sm" href="' + base_url+"movimientos/ventas/edit/"+ row.id + '"><span class="fa fa-pencil"></span></a>';
                        }
                        var btnDelete = '';
                        if (permisos.delete == 1) {
                            btnDelete = '<button class="btn btn-danger btn-sm btn-anular" value="'+row.id+'"><span class="fa fa-times"></span></button>';
                        }

                        var btnPrint = '<a class="btn btn-primary btn-sm" href="' + base_url+"movimientos/ventas/printVenta/"+ row.id + '"><span class="fa fa-print"></span></a>';


                        if (row.estado == 0) {
                            return btnView;
                        }
                        return btnView +' '+ btnEdit + ' ' + btnDelete+ ' '+ btnPrint;
                    }
                } 
            ],
            "language": tradutorDataTables()  

        });
    });

    $(document).ready(function () {
        $('#tbventascreditos').DataTable({
            "processing": true,
            "serverSide": true,
            "ajax":{
                "url": base_url + "movimientos/ventas_creditos/getVentasAll",
                "dataType": "json",
                "type": "POST",
                "data":{  '<?php echo $this->security->get_csrf_token_name(); ?>' : '<?php echo $this->security->get_csrf_hash(); ?>' }
            },
            "columns": [
                { "data": "id" },
                { "data": "numero" },
                { "data": "comprobante" },
                { "data": "cedula" },
                { "data": "cliente" },
                { "data": "fecha" },
                { "data": "total" },
                { "data": "estado",
                    fnCreatedCell: function (nTd, sData, oData, iRow, iCol) {
                        if (oData.estado == 0) {
                            html = '<span class="label label-danger">Anulada</span>';
                        }else{
                            html = '<span class="label label-success">Procesada</span>';
                        }
                        $(nTd).html(html);
                    }
                },
                { "data": "usuario" },
                {
                    mRender: function (data, type, row) {
                        var permisos = JSON.parse($("#permisos").val());
                        var btnView = '<button class="btn btn-info btn-sm btn-view-venta-credito" value="'+row.id+'" data-toggle="modal" data-target="#modal-default"><span class="fa fa-eye"></span></button>';
                        var btnEdit = '';
                        if (permisos.update == 1) {
                            btnEdit = '<a class="btn btn-warning btn-sm" href="' + base_url+"movimientos/ventas_creditos/edit/"+ row.id + '"><span class="fa fa-pencil"></span></a>';
                        }
                        var btnDelete = '';
                        if (permisos.delete == 1) {
                            btnDelete = '<button class="btn btn-danger btn-sm btn-anular-venta-credito" value="'+row.id+'"><span class="fa fa-times"></span></button>';
                        }

                        var btnPrint = '<a class="btn btn-primary btn-sm" href="' + base_url+"movimientos/ventas_creditos/printVenta/"+ row.id + '"><span class="fa fa-print"></span></a>';


                        if (row.estado == 0) {
                            return btnView;
                        }
                        return btnView +' '+ btnEdit + ' ' + btnDelete+ ' '+ btnPrint;
                    }
                } 
            ],
            "language": tradutorDataTables()  

        });
    });

	$('.sidebar-menu').tree();

    $("#comprobantes").on("change",function(){
        option = $(this).val();
        $("#rnc").removeAttr('required');
        $("#idcliente").val('');
        $("#alert-success-rnc").hide();
        $("#rnc").parent('div').removeClass("has-error has-success");
        $("#rnc").parent('div').find('span').removeClass("fa-times fa-check");
        if (option != "") {
            infocomprobante = option.split("*");

            if (infocomprobante[1] == 0) {
                $("#rnc").val(null);
                $("#rnc").removeAttr('required');
                $("#rnc").attr('disabled','disabled');
            }else{
                $("#rnc").removeAttr('disabled');
                $("#rnc").attr('required','required');
            }

            $("#idcomprobante").val(infocomprobante[0]);
        }
        else{
            $("#idcomprobante").val(null);
            $("#rnc").val(null);
            $("#rnc").attr('disabled','disabled');
        }
    })

    $(document).on("click",".btn-check",function(){
        cliente = $(this).val();
        infocliente = cliente.split("*");
        $("#idcliente").val(infocliente[0]);
        $("#cliente").val(infocliente[1]);
        $("#modal-default").modal("hide");
    });
    $("#cliente").autocomplete({
        source:function(request, response){
            $.ajax({
                url: base_url+"movimientos/ventas_creditos/getClientesNormales",
                type: "POST",
                dataType:"json",
                data:{ valor: request.term},
                success:function(data){
                    response(data);
                }
            });
        },
        minLength:2,
        select:function(event, ui){
            //data = ui.item.id + "*"+ ui.item.codigo+ "*"+ ui.item.label+ "*"+ ui.item.precio+ "*"+ ui.item.stock;
            $("#idcliente").val(ui.item.id);
        },
    });
    $("#btn-agregar").on("click",function(){
        data = $(this).val();
        if (data !='') {
            infoproducto = data.split("*");
            html = "<tr>";
            html += "<td><input type='hidden' name='idproductos[]' value='"+infoproducto[0]+"'>"+infoproducto[1]+"</td>";
            html += "<td>"+infoproducto[2]+"</td>";
            html += "<td><input type='hidden' name='precios[]' value='"+infoproducto[3]+"'>"+infoproducto[3]+"</td>";
            html += "<td>"+infoproducto[4]+"</td>";
            html += "<td><input type='text' name='cantidades[]' value='1' class='cantidades'></td>";
            html += "<td><input type='hidden' name='importes[]' value='"+infoproducto[3]+"'><p>"+infoproducto[3]+"</p></td>";
            html += "<td><button type='button' class='btn btn-danger btn-remove-producto'><span class='fa fa-remove'></span></button></td>";
            html += "</tr>";
            $("#tbventas tbody").append(html);
            sumar();
            $("#btn-agregar").val(null);
            $("#producto").val(null);
        }else{
            alert("seleccione un producto...");
        }
    });

    $(document).on("click",".btn-remove-producto", function(){
        $(this).closest("tr").remove();
        sumar();
    });
    $(document).on("keyup mouseup",".cantidad-compra", function(){
        cantidad_compra = $(this).val();
        precio_compra = $(this).closest("tr").children("td:eq(2)").find("input").val();
        importe_compra = cantidad_compra * precio_compra;
        $(this).closest("tr").find("td:eq(5)").children("p").text(importe_compra.toFixed(2));
        $(this).closest("tr").find("td:eq(5)").children("input").val(importe_compra.toFixed(2));
        sumarCompra();
    });
    $(document).on("keyup mouseup",".precios-compras", function(){
        precio_compra = $(this).val();
        cantidad_compra = $(this).closest("tr").children("td:eq(4)").find("input").val();
        importe_compra = cantidad_compra * precio_compra;
        $(this).closest("tr").find("td:eq(5)").children("p").text(importe_compra.toFixed(2));
        $(this).closest("tr").find("td:eq(5)").children("input").val(importe_compra.toFixed(2));
        sumarCompra();
    });

    $(document).on("keyup mouseup","#tborden input.input-cantidad", function(){
        cantidad = $(this).val();
        precio = $(this).closest("tr").find("td:eq(1)").text();
        importe = cantidad * precio;
        $(this).closest("tr").find("td:eq(3)").children("p").text(importe.toFixed(2));
        $(this).closest("tr").find("td:eq(3)").children("input").val(importe.toFixed(2));
        sumar();

    });
    $(document).on("click",".btn-view-compra",function(){
        valor_id = $(this).val();
        $.ajax({
            url: base_url + "movimientos/compras/view",
            type:"POST",
            dataType:"html",
            data:{id:valor_id},
            success:function(data){
                $("#modal-compra .modal-body").html(data);
            }
        });
    });
    $(document).on("click",".btn-view-venta",function(){
        valor_id = $(this).val();
        $.ajax({
            url: base_url + "movimientos/ventas/view",
            type:"POST",
            dataType:"html",
            data:{id:valor_id},
            success:function(data){
                $("#modal-default .modal-body").html(data);
            }
        });
    });
    $(document).on("click",".btn-view-venta-credito",function(){
        valor_id = $(this).val();
        $.ajax({
            url: base_url + "movimientos/ventas_creditos/view",
            type:"POST",
            dataType:"html",
            data:{id:valor_id},
            success:function(data){
                $("#modal-default .modal-body").html(data);
            }
        });
    });

    $(document).on("click",".btn-print",function(){
        $("#modal-default .modal-body").print({
            title:"Comprobante de Venta"
        });
    });
})

function generarnumero(numero){
    if (numero>= 99999 && numero< 999999) {
        return Number(numero)+1;
    }
    if (numero>= 9999 && numero< 99999) {
        return "0" + (Number(numero)+1);
    }
    if (numero>= 999 && numero< 9999) {
        return "00" + (Number(numero)+1);
    }
    if (numero>= 99 && numero< 999) {
        return "000" + (Number(numero)+1);
    }
    if (numero>= 9 && numero< 99) {
        return "0000" + (Number(numero)+1);
    }
    if (numero < 9 ){
        return "00000" + (Number(numero)+1);
    }
}

function verificar(producto_id){
    var existe = 0;
    $('input[name^="productos"]').each(function() {
        if ($(this).val() == producto_id) {
            existe = 1;
        }
    });

    return existe;
}



function sumar(){
    
    total = 0;
    $("#tborden tbody tr").each(function(){
        total = total + Number($(this).find("td:eq(3)").text());
    });
    $("input[name=total]").val(total.toFixed(2));
    $(".total").text(total.toFixed(2));
    $("input[name=itbis]").val((total*0.18).toFixed(2));
    $(".itbis").text((total*0.18).toFixed(2));
    $("input[name=subtotal]").val((total - (total*0.18)).toFixed(2));
    $(".subtotal").text((total - (total*0.18)).toFixed(2));

    if (Number(total)==0) {
        $(".btn-guardar").attr("disabled","disabled");
        $("#save-venta-pendiente").attr("disabled","disabled");
    }

}

function sumarCompra(){
    
    total = 0;
    $("#tb-detalle-compra tbody tr").each(function(){
        total = total + Number($(this).find("td:eq(5)").text());
    });
    $("input[name=total]").val(total.toFixed(2));
    $(".total").text(total.toFixed(2));
    $("input[name=itbis]").val((total*0.18).toFixed(2));
    $(".itbis").text((total*0.18).toFixed(2));
    $("input[name=subtotal]").val((total - (total*0.18)).toFixed(2));
    $(".subtotal").text((total - (total*0.18)).toFixed(2));

    if (Number(total)==0) {
        $("#btn-guardar-compra").attr("disabled","disabled");
    }else{
        $("#btn-guardar-compra").removeAttr("disabled");
    }

}
function datagrafico(base_url,year){
    namesMonth= ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Set","Oct","Nov","Dic"];
    $.ajax({
        url: base_url + "dashboard/getData",
        type:"POST",
        data:{year: year},
        dataType:"json",
        success:function(data){
            var meses = new Array();
            var montos = new Array();
            $.each(data,function(key, value){
                meses.push(namesMonth[value.mes - 1]);
                valor = Number(value.monto);
                montos.push(valor);
            });
            graficar(meses,montos,year);
        }
    });
}

function graficar(meses,montos,year){
    Highcharts.chart('grafico', {
    chart: {
        type: 'column'
    },
    title: {
        text: 'Monto acumulado por las ventas de los meses'
    },
    subtitle: {
        text: 'Año:' + year
    },
    xAxis: {
        categories: meses,
        crosshair: true
    },
    yAxis: {
        min: 0,
        title: {
            text: 'Monto Acumulado (soles)'
        }
    },
    tooltip: {
        headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
        pointFormat: '<tr><td style="color:{series.color};padding:0">Monto: </td>' +
            '<td style="padding:0"><b>{point.y:.2f} soles</b></td></tr>',
        footerFormat: '</table>',
        shared: true,
        useHTML: true
    },
    plotOptions: {
        column: {
            pointPadding: 0.2,
            borderWidth: 0
        },
        series:{
            dataLabels:{
                enabled:true,
                formatter:function(){
                    return Highcharts.numberFormat(this.y,2)
                }

            }
        }
    },
    series: [{
        name: 'Meses',
        data: montos

    }]
});
}
function zfill(number, width) {
    var numberOutput = Math.abs(number); /* Valor absoluto del número */
    var length = number.toString().length; /* Largo del número */ 
    var zero = "0"; /* String de cero */  
    
    if (width <= length) {
        if (number < 0) {
             return ("-" + numberOutput.toString()); 
        } else {
             return numberOutput.toString(); 
        }
    } else {
        if (number < 0) {
            return ("-" + (zero.repeat(width - length)) + numberOutput.toString()); 
        } else {
            return ((zero.repeat(width - length)) + numberOutput.toString()); 
        }
    }
}