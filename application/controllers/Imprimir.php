<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Imprimir extends CI_Controller {

	public function __construct(){
		parent::__construct();
		$this->load->library('user_agent');

	}

	public function index(){

		parse_str(substr(strrchr($_SERVER['REQUEST_URI'], "?"), 1), $_GET);

		// grab values as you would from an ordinary $_GET superglobal array associative index.
		$ticket = $_GET['ticket']; 
		
		if ($ticket == "venta") {
			$venta = json_decode($_GET['venta']); 
			$detalles = json_decode($_GET['detalles']); 
			$from = $_GET['from']; 
			$serie = $_GET['serie']; 
			$this->printVenta($venta,$detalles,$from,$serie);
		} else {
			
			$caja = json_decode($_GET['caja']);
			$tarjetas = json_decode($_GET['tarjetas']);
			$gastos = json_decode($_GET['gastos']);
			$descuentos = json_decode($_GET['descuentos']);
			$creditos = json_decode($_GET['creditos']);


			$cajero_nombre = $_GET['cajero_nombre'];
			$total_creditos = $_GET['total_creditos'];
			$total_descuentos= $_GET['total_descuentos'];
			$total_efectivo = $_GET['total_efectivo'];
			$total_ventas = $_GET['total_ventas'];
			$total_gastos = $_GET['total_gastos'];
			$numero_ventas= $_GET['numero_ventas'];
			$this->printCaja($caja,$tarjetas,$gastos,$descuentos,$creditos,$cajero_nombre,$total_creditos,$total_descuentos,$total_efectivo,$total_ventas,$total_gastos,$numero_ventas);
		}
	}

	public function printCaja($caja,$tarjetas,$gastos,$descuentos,$creditos,$cajero_nombre,$total_creditos,$total_descuentos,$total_efectivo,$total_ventas,$total_gastos,$numero_ventas){
		try {
			$this->load->library("EscPos.php");
			$connector = new Escpos\PrintConnectors\WindowsPrintConnector("quicheladas");

		
			$logo = "img/quicheladas3.png";
			$img_logo = Escpos\EscposImage::load($logo,false);
			$printer = new Escpos\Printer($connector);
			$printer -> setJustification(Escpos\Printer::JUSTIFY_CENTER);
			/* Name of shop */
			$printer -> selectPrintMode();
			$printer -> setEmphasis(true);
			$printer -> text("Quicheladas\n");
			$printer->bitImage($img_logo);
			$printer -> setEmphasis(false);
			$printer -> selectPrintMode();
			$printer -> text("3a. Calle 1-06 Zona 1, 2do. Nivel Farmacia\n");
			$printer -> text("Batres Don Paco Santa Cruz del Quiche\n");
			$printer -> feed();

			$printer -> setEmphasis(true);
			$printer -> text("Corte de Caja\n");
			$printer -> text("Cajero:");
			$printer -> setEmphasis(false);
			$printer -> text($cajero_nombre."\n");
			$printer -> feed();

			$printer -> setEmphasis(true);
			$printer -> text("Fecha:");
			$printer -> setEmphasis(false);
			$printer -> text($caja->fecha_cierre."\n");

			$printer -> setEmphasis(true);
			$printer -> text("No. de Caja:");
			$printer -> setEmphasis(false);
			$printer -> text("1\n");
			$printer -> feed();

			$printer -> setEmphasis(true);
			$printer -> text("DETALLES DE PAGO\n");
			$printer -> setEmphasis(false);

			$printer -> setEmphasis(true);
			$printer -> text("Efectivo:");
			$printer -> setEmphasis(false);
			$printer -> text($caja->monto_efectivo."\n");
			$printer -> feed();

			$printer -> setEmphasis(true);
			$printer -> text("TARJETAS DE CREDITO\n");
			$printer -> setEmphasis(false);

			$totalTarjetas = 0;
			foreach ($tarjetas as $tarjeta){
				$printer -> setEmphasis(true);
				$printer -> text($tarjeta->nombre);
				$printer -> setEmphasis(false);
				$printer -> text($tarjeta->totalTarjeta."\n");

				$totalTarjetas = $totalTarjetas + $tarjeta->totalTarjeta;
			}
			$printer -> setEmphasis(true);
			$printer -> text("Monto total en Tarjeta:");
			$printer -> setEmphasis(false);
			$printer -> text($totalTarjetas."\n");
			$printer -> feed();

			$printer -> setEmphasis(true);
			$printer -> text("DESCUENTOS\n");
			$printer -> setEmphasis(false);

			if (!empty($descuentos)){
				$printer -> setJustification(Escpos\Printer::JUSTIFY_LEFT);
				foreach ($descuentos as $d){
					$printer -> text(" N° ".str_pad($d->num_documento,22).str_pad($d->descuento, 22, " ", STR_PAD_LEFT)."\n");
				}
				$printer -> setJustification(Escpos\Printer::JUSTIFY_CENTER);
			} else {
				$printer -> text("---------\n");
			}
			$printer -> feed();
			$printer -> setEmphasis(true);
			$printer -> text("GASTOS\n");
			$printer -> setEmphasis(false);

			if (!empty($gastos)){
				$printer -> setJustification(Escpos\Printer::JUSTIFY_LEFT);
				foreach ($gastos as $g){
					$printer -> text(str_pad($g->nombre,24).str_pad($g->monto, 24, " ", STR_PAD_LEFT)."\n");
				}
				$printer -> setJustification(Escpos\Printer::JUSTIFY_CENTER);
			} else {
				$printer -> text("---------\n");
			}

			$printer -> feed();
			$printer -> setEmphasis(true);
			$printer -> text("CREDITOS\n");
			$printer -> setEmphasis(false);

			if (!empty($creditos)){
				$printer -> setJustification(Escpos\Printer::JUSTIFY_LEFT);
				foreach ($creditos as $c){
					$printer -> text(" N° ".str_pad($c->num_documento,22).str_pad($c->monto_credito, 22, " ", STR_PAD_LEFT)."\n");
				}
				$printer -> setJustification(Escpos\Printer::JUSTIFY_CENTER);
			} else {
				$printer -> text("---------\n");
			}

			$printer -> feed();

			$printer -> setEmphasis(true);
			$printer -> text("VENTAS AL CREDITO\n");
			$printer -> text("Total:");
			$printer -> setEmphasis(false);
			$printer -> text($total_creditos."\n");
			$printer -> feed();
			$printer -> setEmphasis(true);
			$printer -> text("Descuentos:");
			$printer -> setEmphasis(false);
			$printer -> text($total_descuentos."\n");
			$printer -> setEmphasis(true);
			$printer -> text("Caja Inicial:");
			$printer -> setEmphasis(false);
			$printer -> text($caja->monto_apertura."\n");
			$printer -> setEmphasis(true);
			$printer -> text("Efectivo Recolectado:");
			$printer -> setEmphasis(false);
			$printer -> text($total_ventas."\n");
			$printer -> setEmphasis(true);
			$printer -> text("Gastos:");
			$printer -> setEmphasis(false);
			$printer -> text($total_gastos."\n");

			$efectivo = $caja->monto_apertura + $total_efectivo - $total_gastos;

			$printer -> setEmphasis(true);
			$printer -> text("Efectivo a Entregar:");
			$printer -> setEmphasis(false);
			$printer -> text(number_format($efectivo, 2, '.', '')."\n");
			$printer -> setEmphasis(true);
			$printer -> text("Efectivo Recolectado:");
			$printer -> setEmphasis(false);
			$printer -> text($caja->monto_efectivo."\n");

			$printer -> setEmphasis(true);
			$printer -> text("Monto Faltante:");
			$printer -> setEmphasis(false);
			$printer -> text(number_format($efectivo - $caja->monto_efectivo, 2, '.', '')."\n");
			$printer -> setEmphasis(true);
			$printer -> text("Total de transacciones:");
			$printer -> setEmphasis(false);
			$printer -> text($numero_ventas."\n");
			$printer -> setEmphasis(true);
			$printer -> text("Prom de Transaccion por Cuenta:");
			$printer -> setEmphasis(false);
			
			if ($numero_ventas > 0){
				$printer -> text(number_format($total_ventas/$numero_ventas, 2, '.', '')."\n");

			}else{
				$printer -> text("0.00\n");
			}

			$printer -> feed();
			$printer -> feed();
			$printer -> feed();
			$printer -> feed();
			$printer -> text("F.__________________\n");
			$printer -> text("Gerente\n");
			$printer -> feed();
			$printer -> feed();
			$printer -> feed();
			$printer -> feed();
			$printer -> text("F.__________________\n");

			$printer -> feed();
			$printer -> feed();

			$printer -> cut();
			$printer -> pulse();
			$printer -> close();
			
			//echo "Se imprimio el ticket";
			redirect("https://quicheladas.wilsonicx.com/caja/apertura_cierre");


		} catch (Exception $e) {
			redirect("https://quicheladas.wilsonicx.com/caja/apertura_cierre");
		}
	}

	public function printVenta($venta,$detalles,$from,$serie){
		$this->load->library("EscPos.php");
		
		$connector = new Escpos\PrintConnectors\WindowsPrintConnector("deposito");
		try {
			/* Information for the receipt */
			$items = array();
			foreach($detalles as $detalle){
				$items[] = new item($detalle->cantidad,$detalle->prefijo,$detalle->nombre,$detalle->importe);
			}
			$logo = "img/quicheladas3.png";
			$img_logo = Escpos\EscposImage::load($logo,false);
			$printer = new Escpos\Printer($connector);
			
			$printer -> setJustification(Escpos\Printer::JUSTIFY_CENTER);
			
			/* Name of shop */
			$printer -> selectPrintMode();
			$printer -> setEmphasis(true);
			$printer -> text("Deposito\n");
			$printer->bitImage($img_logo);
			$printer -> setEmphasis(false);
			$printer -> selectPrintMode();
			$printer -> text("3a. Calle 1-06 Zona 1, 2do. Nivel Farmacia\n");
			$printer -> text("Batres Don Paco Santa Cruz del Quiche\n");
			$printer -> feed();
			$printer -> setEmphasis(true);
			$printer -> text($venta->comprobante."\n");
			$printer -> setEmphasis(false);
			$printer -> text($serie ." - ".$venta->numero_comprobante."\n");
			$printer -> feed();
			$printer -> setJustification(Escpos\Printer::JUSTIFY_LEFT);
			//$pedido = getPedido($venta->pedido_id);
			$printer -> setEmphasis(true);
			$printer -> text("Estado:");
			$printer -> setEmphasis(false);
		
			if ($venta->estado == "1") {
				$printer -> text("Pagado\n");
            }else if($venta->estado == "2"){
            	$printer -> text("Pendiente\n");
            }else{
            	$printer -> text("Anulado\n");
            } 

            $printer -> setEmphasis(true);
			$printer -> text("Cliente:");
			$printer -> setEmphasis(false);
			$printer -> text($venta->nombre."\n");
            
			$printer -> setEmphasis(true);
			$printer -> text("Fecha y Hora:");
			$printer -> setEmphasis(false);
			$printer -> text($venta->fecha."\n");

			$printer -> setEmphasis(true);
			$printer -> text("Cajero:");
			$printer -> setEmphasis(false);
			$printer -> text($venta->usuario."\n");
            
			$printer->setEmphasis(true);
			$printer->text($this->addSpaces('CANT.', 6) .$this->addSpaces('U.M.', 6). $this->addSpaces('DESCRIPCION', 28) . $this->addSpaces('IMPORTE', 8,LEFT) . "\n");
			/* Items */
			$printer -> setEmphasis(false);
			foreach ($items as $key => $item) {
			    $printer -> text($item);
			}
			$printer -> setEmphasis(true);
			$printer -> text($this->addSpaces('SUBTOTAL',36,LEFT).$this->addSpaces($venta->subtotal,12,LEFT)."\n");
			$printer -> text($this->addSpaces('DESCUENTO',36,LEFT).$this->addSpaces($venta->descuento,12,LEFT)."\n");
			$printer -> text($this->addSpaces('TOTAL',36,LEFT).$this->addSpaces($venta->total,12,LEFT)."\n");
			$printer -> setEmphasis(false);
			$printer -> feed();
			$printer -> setJustification(Escpos\Printer::JUSTIFY_CENTER);
			$printer -> text("Gracias por su preferencia\n");
			$printer -> text("Si el servicio fue de tu agrado, agradeceremos una Propina\n");
			$printer -> text("Recuerda visitarnos en:\n");
			$printer -> text("www.quicheladas.com\n");
			$printer -> text("Quicheladas y Ceviches\n");
			
			$printer -> feed();
			$printer -> feed();
			
			/* Cut the receipt and open the cash drawer */
			$printer -> cut();
			$printer -> pulse();
			$printer -> close();
			/* A wrapper to do organise item names & prices into columns */
			/*$this->session->set_flashdata("success", "Se imprimio la venta ".$venta->serie."-".$venta->num_documento);

			redirect($this->agent->referrer());*/
			
			redirect("https://quicheladas.wilsonicx.com/movimientos/ventas");
			
		} catch (Exception $e) {
			//echo "Couldn't print to this printer: " . $e -> getMessage() . "\n";
			/*$this->session->set_flashdata("error",$e -> getMessage());*/

			redirect("https://quicheladas.wilsonicx.com/movimientos/ventas");
		}
	}
	protected function addSpaces($text,$length,$dir = RIGHT,$character =' '){
		if ($dir == LEFT) {
			return str_pad($text, $length, $character, STR_PAD_LEFT);
		}else{
			return str_pad($text, $length); 
		}
		
	}
}



class item
{
    private $quantity;
    private $prefix;
    private $name;
    private $amount;
    public function __construct($quantity = '',$prefix='', $name = '', $amount = '')
    {
        $this -> quantity = $quantity;
        $this -> prefix = $prefix;
        $this -> name = $name;
        $this -> amount = $amount;
    }
    
    public function __toString()
    {
        $numberColsQuantity = 6;
        $numberColsPrefix = 6;
        $numberColsName = 30;
        $numberColsAmount = 6;
    
        $quantity = str_pad($this -> quantity, $numberColsQuantity) ;
        $prefix = str_pad($this -> prefix, $numberColsPrefix) ;

        $name = str_pad($this -> name, $numberColsName) ;
       
        $amount = str_pad($this -> amount, $numberColsAmount, ' ', STR_PAD_LEFT);
        return "$quantity$prefix$name$amount\n";
    }
}
