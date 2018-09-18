<?php
 require_once('backend/controller/configuracion.php');
 /*
  * Very Special Thanks to Guido
  * for you aportation in http://php.net/manual/es/mysqli-stmt.bind-param.php
  */
 class stmt extends mysqli_stmt {
 	public function __construct($link, $query) {
 		$this->mbind_reset();
 		parent::__construct($link, $query);
 	}
 
 	public function mbind_reset() {
 		unset($this->mbind_params);
 		unset($this->mbind_types);
 		$this->mbind_params = array();
 		$this->mbind_types = array();
 	}
 
 	//use this one to bind params by reference
 	public function mbind_param($type, &$param) {
 		$this->mbind_types[0].= $type;
 		$this->mbind_params[] = &$param;
 	}
 
 	//use this one to bin value directly, can be mixed with mbind_param()
 	public function mbind_value($type, $param) {
 		$this->mbind_types[0].= $type;
 		$this->mbind_params[] = $param;
 	}
 
 
 	public function mbind_param_do() {
 		$params = array_merge($this->mbind_types, $this->mbind_params);
 		return call_user_func_array(array($this, 'bind_param'), $this->makeValuesReferenced($params));
 	}
 
 	private function makeValuesReferenced($arr){
 		$refs = array();
 		foreach($arr as $key => $value)
 			$refs[$key] = &$arr[$key];
 			return $refs;
 
 	}
 
 	public function execute() {
 		if(count($this->mbind_params))
 			$this->mbind_param_do();
 
 			return parent::execute();
 	}
 
 	private $mbind_types = array();
 	private $mbind_params = array();
 }
 
  class Conexion extends mysqli {
   private $host = '';
   private $user = '';
   private $pass = '';
   private $apli = '';
   
   private $lista_errores;
   private $filas_afectadas;
   
   private $conex;
   
   public function filasAfectadas() {
   	return $this->filas_afectadas;
   }
   public function hayError() {
   	return (count($this->lista_errores)>0);
   }
   public function getListaErrores() {
   	return $this->lista_errores;
   }
   private function conecta() {
    $this->conex = mysqli_connect($this->host,$this->user,$this->pass,$this->apli);
   }
   public function get() {
    if (!isset($this->conex)) $this->conecta();
    return $this->conex;
   }
   private function recupera_resultado($statment) {
   	$RESULT = array();
   	$statment->store_result();
   	for ( $i = 0; $i < $statment->num_rows; $i++ ) {
   		$Metadata = $statment->result_metadata();
   		$PARAMS = array();
   		while ( $Field = $Metadata->fetch_field() ) {
   			$PARAMS[] = &$RESULT[ $i ][ $Field->name ];
   		}
   		call_user_func_array( array( $statment, 'bind_result' ), $PARAMS );
   		$statment->fetch();
   	}
   	return $RESULT;
   }
   public function consulta($query, $array) {
   	$stmt = $this->prepare($query);
   	foreach ($array as $param) $stmt->mbind_value($param["tipo"], $param["dato"]);
   	$stmt->execute();
   	# 30.08.2016 - Hostinger no tiene bien configurado mysqlnd
   	# código con mysqlnd mal configurado
   	$data = array();
   	$data = $this->recupera_resultado($stmt);
   	$stmt->close();
   	# código viejo con mysqlnd bien configurado
   	#$_res = $stmt->get_result();
   	#$stmt->close();
   	#$data = array();
   	#while($row = $_res->fetch_array(MYSQLI_ASSOC)) array_push($data, $row);
   	return $data;
   }
   
   public function ejecuta($query, $array) {
   	$stmt = $this->prepare($query);
   	foreach ($array as $param) $stmt->mbind_value($param["tipo"], $param["dato"]);
   	$stmt->execute();
   	$this->filas_afectadas = $stmt->affected_rows;
   	if (count($stmt->error_list)>0) {
   		$this->lista_errores = $stmt->error_list;
   		foreach ($stmt->error_list as $detalle) new Excepcion($detalle['error'],1);
   	}
   	$stmt->close();
   }
   
   public function close() {
    if (!isset($this->conex)) mysqli_close($this->conex);
   }
   /* reescribimos la función de MySQLi para poder hacer las bind variables una a una */
   public function prepare($query) { 
   	return new stmt($this->get(),$query); 
   }
   function __construct() {
    $conf = new configuracion();
   	$this->host = $conf->getHost();
    $this->user = $conf->getUser();
    $this->pass = $conf->getPass();
    $this->apli = $conf->getApli();
    $this->conecta();
   }
 }
?>
