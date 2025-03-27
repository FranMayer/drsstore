<?php

// Importar las clases necesarias de MercadoPago
use MercadoPago\MercadoPagoConfig;
use MercadoPago\Resources\Preference;
use MercadoPago\Resources\Preference\Item;
use MercadoPago\Client\Preference\PreferenceClient;

// Incluir el autoload de MercadoPago
require __DIR__ . '/vendor/autoload.php';

// Configurar el Access Token
MercadoPagoConfig::setAccessToken('APP_USR-8508290774659378-031115-a3cd92f304882b408fce3e5a0eff967a-192165018');

// Crear el cliente de preferencias
$client = new PreferenceClient();


// Asegurarse de que la respuesta sea JSON
header('Content-Type: application/json');
echo json_encode(["preference_id" => $preference->id]);


$items = [];

// Verificar si el carrito tiene productos
if (isset($cart['items']) && is_array($cart['items'])) {
    // Crear los ítems dinámicamente
    foreach ($cart['items'] as $product) {
        // Verificar que cada producto tiene las claves necesarias
        if (isset($product['id'], $product['title'], $product['quantity'], $product['price'])) {
            $item = new Item();
            $item->id = $product['id'];
            $item->title = $product['title'];
            $item->quantity = $product['quantity'];
            $item->currency_id = "ARS";
            $item->unit_price = $product['price'];
            $items[] = $item;
        } else {
            // Si algún campo falta, devolver un error
            echo json_encode(["error" => "Faltan datos en el carrito."]);
            exit;
        }
    }

    // Crear la preferencia
    $preference = $client->create([
        "items" => $items,
        "statement_descriptor" => "Tienda e-commerce",
        "external_reference" => "DRS-STORE",
        "back_urls" => [
            "success" => "http://localhost/drs-store/aprove.html",
            "failure" => "http://localhost/drs-store/err.html",
            "pending" => "http://localhost/drs-store/pending.html"
        ],
        "auto_return" => "approved"
    ]);

    // Retornar el ID de la preferencia en formato JSON
    echo json_encode(["preference_id" => $preference->id]);
} else {
    // Si no hay productos en el carrito, retornar error
    echo json_encode(["error" => "El carrito está vacío o no tiene productos."]);
}
 
// Configurar el manejo de errores
error_reporting(E_ALL & ~E_DEPRECATED); // No mostrar advertencias de deprecación
ini_set('display_errors', 0); // Deshabilitar la visualización de errores en el navegador

var_dump($preference); // Muestra el objeto Preference
exit;


?>
