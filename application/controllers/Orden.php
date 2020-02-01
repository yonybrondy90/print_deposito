<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Orden extends CI_Controller {

	public function __construct(){
		parent::__construct();
		$this->load->library('user_agent');

	}

	public function index(){

		parse_str(substr(strrchr($_SERVER['REQUEST_URI'], "?"), 1), $_GET);

		// grab values as you would from an ordinary $_GET superglobal array associative index.
		$infoPedido = json_decode($_GET['infoPedido']); 
		$nummesas = $_GET['nummesas']; 
		$subcatproductos = json_decode($_GET['subcatproductos']); 
	
		
		$dataPrint = array();
		$total = 0;

		foreach($subcatproductos as $sp){
			$data['nombre'] = $sp->nombre;
            $dataItem = [];
            foreach ($sp->subs as $p){
                $cantidad = $p->cantidad - $p->pagados;

                $item = new item($p->nombre,$cantidad,number_format($p->precio, 2, '.', ''),number_format(($cantidad * $p->precio), 2, '.', ''));

                $total = $total + ($cantidad * $p->precio);
                
                $htmlExtras = "";
                $totalExtras = 0.00;
                //$extras = getPreciosExtras($p->pedido_id,$p->producto_id,$p->codigo);

                if (!empty($p->extras)) {
                    foreach ($p->extras as $e) {
                        $nombre = $e->nombre;
                        
                        if ($e->precio == "0.00") {
                            $precio = "";
                        }else{
                            $precio = $e->precio;
                        }
                        
                        $importe = $e->precio * $cantidad;
                        if ($importe == 0) {
                            $importe ='';
                        }else {
                            $importe = number_format($importe, 2, '.', '');
                        }
                        $htmlExtras .= new item($nombre,$cantidad,$precio,$importe);
                        $totalExtras = $totalExtras + ($e->precio * $cantidad);
                    }
                }

                $dataItem[] = [$item,$htmlExtras];

                

                  
                $total = $total + $totalExtras;
               
            }
            $data['item'] = $dataItem;
            $dataPrint[] = $data;
        }

		$this->load->library("EscPos.php");
		$connector = new Escpos\PrintConnectors\WindowsPrintConnector("POS58C");

		try {
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
			$printer -> text("El consumo es para:");
			$printer -> setEmphasis(false);
			if ($infoPedido->tipo_consumo == '1') {
				$printer -> text("Comer en el Restaurant");
			}else{
				$printer -> text("Llevar");
			}
			$printer -> feed();
			$printer -> setEmphasis(true);
			$printer -> text("Mesas:");
			$printer -> setEmphasis(false);
			$printer -> text(substr($nummesas, 0, -1));
			$printer -> feed();
		
			$printer -> setJustification(Escpos\Printer::JUSTIFY_LEFT);
			$printer->setEmphasis(true);
			$printer->text($this->addSpaces('PRODUCTO', 14) . $this->addSpaces('CANT.', 3) . $this->addSpaces('PRECIO', 6,LEFT) . $this->addSpaces('IMPORTE', 7,LEFT) . "\n");
			/* Items */
			$printer -> setEmphasis(false);
			foreach ($dataPrint as $key => $value) {
				$printer -> setJustification(Escpos\Printer::JUSTIFY_CENTER);
				$printer -> setEmphasis(true);
			    $printer -> text($value['nombre']."\n");
			    $printer -> setEmphasis(false);
			    $printer -> setJustification(Escpos\Printer::JUSTIFY_LEFT);
			    foreach ($value['item'] as $key2 => $value2) {
					$printer -> text($value2[0]);
					$printer -> text($value2[1]);
				}
			    $printer -> text($extras_items[$key]);
			}
			$printer -> setEmphasis(true);
		
			$printer -> text($this->addSpaces('TOTAL',18,LEFT).$this->addSpaces(number_format($total, 2, '.', ''),12,LEFT)."\n");
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
			$this->session->set_flashdata("success", "Se imprimio el pedido ".$idPedido);

			redirect($this->agent->referrer());
		} catch (Exception $e) {
			//echo "Couldn't print to this printer: " . $e -> getMessage() . "\n";
			$this->session->set_flashdata("error",$e -> getMessage());

			redirect($this->agent->referrer());
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
    private $name;
    private $amount;
    private $price;
    public function __construct($name = '',$quantity = '',$price='' , $amount = '')
    {
    	$this -> price = $price;
        $this -> quantity = $quantity;
        $this -> name = $name;
        $this -> amount = $amount;
    }
    
    public function __toString()
    {
        $numberColsQuantity = 3;
        $numberColsName = 18;
        $numberColsAmount = 5;
    	$numberColsPrice = 6;

    	$price = str_pad($this -> price, $numberColsPrice) ;
        $quantity = str_pad($this -> quantity, $numberColsQuantity) ;
        $name = str_pad($this -> name, $numberColsName) ;
       
        $amount = str_pad($this -> amount, $numberColsAmount, ' ', STR_PAD_LEFT);
        return "$name$quantity$price$amount\n";
    }
}