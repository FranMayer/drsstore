<?php
// Requiere el autoload generado por Composer
require __DIR__ . '/vendor/autoload.php'; 

// Configura tu Access Token de Mercado Pago (coloca tu token aquí)
MercadoPago\SDK::setAccessToken('TU_ACCESS_TOKEN'); 

// Crear la preferencia de pago
$preference = new MercadoPago\Preference();

// Crear un item (producto)
$item = new MercadoPago\Item();
$item->title = 'Remera Ferrari'; // Nombre del producto
$item->quantity = 1; // Cantidad
$item->unit_price = 25.99; // Precio del producto

// Agregar el item a la preferencia
$preference->items = array($item);

// Guardar la preferencia (esto genera la preferencia en Mercado Pago)
$preference->save();

// Mostrar el ID de la preferencia y el enlace de pago
echo "ID de la preferencia: " . $preference->id . "<br>";
echo "Link para pagar: <a href='" . $preference->init_point . "'>Pagar con Mercado Pago</a>";
?>


