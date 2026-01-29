<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require __DIR__ . '/vendor/autoload.php';

use MercadoPago\MercadoPagoConfig;
use MercadoPago\Client\Preference\PreferenceClient;

// Tu Access Token
MercadoPagoConfig::setAccessToken('APP_USR-4684124298593212-012317-07edee4780ed36e47e254ac1dd0874a5-2323014130');

echo "<h2>Test de Mercado Pago</h2>";

try {
    $client = new PreferenceClient();
    
    $preference = $client->create([
        "items" => [
            [
                "title" => "Producto de prueba",
                "quantity" => 1,
                "currency_id" => "ARS",
                "unit_price" => 100.00
            ]
        ]
    ]);

    echo "<p style='color:green'>✅ Preferencia creada exitosamente!</p>";
    echo "<p>ID: " . $preference->id . "</p>";
    echo "<p>Init Point: <a href='" . $preference->init_point . "' target='_blank'>Ir a pagar</a></p>";

} catch (\MercadoPago\Exceptions\MPApiException $e) {
    echo "<p style='color:red'>❌ Error de API</p>";
    echo "<pre>";
    echo "Status: " . $e->getStatusCode() . "\n";
    echo "Message: " . $e->getMessage() . "\n";
    $response = $e->getApiResponse();
    if ($response) {
        echo "Response: " . print_r($response->getContent(), true);
    }
    echo "</pre>";
} catch (Exception $e) {
    echo "<p style='color:red'>❌ Error general</p>";
    echo "<pre>" . $e->getMessage() . "</pre>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}
?>
