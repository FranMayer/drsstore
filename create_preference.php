<?php
use MercadoPago\MercadoPagoConfig;
use MercadoPago\Client\Preference\PreferenceClient;
use MercadoPago\Resources\Preference\Item;
use MercadoPago\Resources\Preference;


require __DIR__ . '/vendor/autoload.php';




// Configurar Access Token
MercadoPagoConfig::setAccessToken('APP_USR-8508290774659378-031115-a3cd92f304882b408fce3e5a0eff967a-192165018');

// Crear cliente de preferencias
$client = new PreferenceClient();

// Definir los ítems de la compra
$item = new Item();
$item->id = "1234";
$item->title = "Remera Ferrari";
$item->quantity = 1;
$item->currency_id = "ARS";
$item->unit_price = 12500.0;

// Crear la preferencia
$preference = $client->create([
    "items" => [$item],
    "statement_descriptor" => "Tienda e-commerce",
    "external_reference" => "DRS-STORE",
    "back_urls" => [
        "success" => "http://localhost/drs-store/aprove.html",
        "failure" => "http://localhost/drs-store/err.html",
        "pending" => "http://localhost/drs-store/pending.html"
    ],
    "auto_return" => "approved"
]);

header('Content-Type: application/json');


// Retornar el ID de la preferencia en JSON
echo json_encode(["preference_id" => $preference->id]);

error_reporting(E_ALL & ~E_DEPRECATED);
ini_set('display_errors', 1);
error_reporting(E_ALL);

?>
