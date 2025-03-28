<?php

// autoload_real.php @generated by Composer

class ComposerAutoloaderInite57a81a638c6f53ae5967763c7a9a374
{
    private static $loader;

    public static function loadClassLoader($class)
    {
        if ('Composer\Autoload\ClassLoader' === $class) {
            require __DIR__ . '/ClassLoader.php';
        }
    }

    /**
     * @return \Composer\Autoload\ClassLoader
     */
    public static function getLoader()
    {
        if (null !== self::$loader) {
            return self::$loader;
        }

        require __DIR__ . '/platform_check.php';

        spl_autoload_register(array('ComposerAutoloaderInite57a81a638c6f53ae5967763c7a9a374', 'loadClassLoader'), true, true);
        self::$loader = $loader = new \Composer\Autoload\ClassLoader(\dirname(__DIR__));
        spl_autoload_unregister(array('ComposerAutoloaderInite57a81a638c6f53ae5967763c7a9a374', 'loadClassLoader'));

        require __DIR__ . '/autoload_static.php';
        call_user_func(\Composer\Autoload\ComposerStaticInite57a81a638c6f53ae5967763c7a9a374::getInitializer($loader));

        $loader->register(true);

        return $loader;
    }
}
