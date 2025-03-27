<?php
require __DIR__ . '/vendor/autoload.php';

if (class_exists('MercadoPago\Preference')) {
    echo 'La clase MercadoPago\Preference está cargada correctamente.';
} else {
    echo 'La clase MercadoPago\Preference no está cargada.';
}
?>
