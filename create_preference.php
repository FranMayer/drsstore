<?php
/**
 * VOLT Store - Crear preferencia de Mercado Pago
 * Este archivo recibe los items del carrito y crea una preferencia de pago
 */

// Configurar errores (MOSTRAR para debug)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Headers para CORS y JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Importar las clases necesarias de MercadoPago
use MercadoPago\MercadoPagoConfig;
use MercadoPago\Client\Preference\PreferenceClient;

// Incluir el autoload de Composer
require __DIR__ . '/vendor/autoload.php';

// =====================================================
// CONFIGURACIÓN - Reemplaza con tu Access Token
// =====================================================
// Obtén tu Access Token en: https://www.mercadopago.com.ar/developers/panel/app
MercadoPagoConfig::setAccessToken('APP_USR-4684124298593212-012317-07edee4780ed36e47e254ac1dd0874a5-2323014130');

// =====================================================
// RECIBIR DATOS DEL FRONTEND
// =====================================================
$input = file_get_contents('php://input');
$cart = json_decode($input, true);

// Verificar que llegaron datos
if (!$cart || !isset($cart['items']) || !is_array($cart['items']) || count($cart['items']) === 0) {
    echo json_encode(["error" => "El carrito está vacío o no tiene productos válidos."]);
    exit;
}

// =====================================================
// CREAR ITEMS PARA MERCADO PAGO
// =====================================================
$items = [];

foreach ($cart['items'] as $product) {
    // Verificar que cada producto tiene los campos necesarios
    if (!isset($product['title'], $product['quantity'], $product['price'])) {
        echo json_encode(["error" => "Faltan datos en algún producto del carrito."]);
        exit;
    }

    $items[] = [
        "title" => $product['title'],
        "quantity" => (int) $product['quantity'],
        "currency_id" => "ARS",
        "unit_price" => (float) $product['price']
    ];
}

// =====================================================
// CREAR LA PREFERENCIA
// =====================================================
try {
    $client = new PreferenceClient();
    
    $preference = $client->create([
        "items" => $items,
        "statement_descriptor" => "VOLT Store",
        "external_reference" => "VOLT-" . time()
        // back_urls y auto_return se agregan en producción con dominio real
    ]);

    // Retornar el ID de la preferencia
    echo json_encode([
        "preference_id" => $preference->id,
        "init_point" => $preference->init_point
    ]);

} catch (\MercadoPago\Exceptions\MPApiException $e) {
    // Error específico de la API de Mercado Pago
    $response = $e->getApiResponse();
    $content = $response ? $response->getContent() : null;
    echo json_encode([
        "error" => "Error de API",
        "status" => $e->getStatusCode(),
        "message" => $e->getMessage(),
        "api_response" => $content
    ]);
} catch (Exception $e) {
    echo json_encode([
        "error" => "Error: " . $e->getMessage(),
        "trace" => $e->getTraceAsString()
    ]);
}

?>
