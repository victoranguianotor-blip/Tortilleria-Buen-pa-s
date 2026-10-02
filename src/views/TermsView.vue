<script setup lang="ts">
import LegalPage from '@/components/LegalPage.vue'
import { LEGAL } from '@/legal'
</script>

<template>
  <LegalPage title="Términos de uso">
    <p>
      Reparto de Tortillas es una herramienta interna de <strong>{{ LEGAL.owner }}</strong> para
      registrar las rutas de reparto. Al entrar con tu cuenta aceptas estos términos.
    </p>

    <h2>Quién puede usarla</h2>
    <p>
      Solo el personal autorizado por el negocio. No hay registro público: las cuentas las crea el
      encargado, que también puede desactivarlas en cualquier momento, por ejemplo cuando alguien
      deja de trabajar con el negocio.
    </p>

    <h2>Tu cuenta</h2>
    <ul>
      <li>La cuenta es personal. No compartas tu usuario ni tu contraseña.</li>
      <li>
        Lo que se registre con tu cuenta se considera hecho por ti. Si crees que alguien más conoce
        tu contraseña, avisa al encargado para que la cambie.
      </li>
      <li>Cierra la sesión si usas una tablet que comparten otras personas.</li>
    </ul>

    <h2>Lo que registras</h2>
    <ul>
      <li>
        Registra los kilos, el dinero cobrado y las paradas como realmente ocurrieron. Si te
        equivocas, corrígelo mientras la ruta esté abierta o pide al encargado que la reabra.
      </li>
      <li>Los registros son el control interno del negocio y sirven para los reportes diarios.</li>
      <li>En las notas escribe solo lo necesario para el trabajo.</li>
    </ul>

    <h2>Uso no permitido</h2>
    <p>
      No está permitido intentar ver o modificar información de otras personas, entrar con una
      cuenta ajena, alterar el funcionamiento de la aplicación ni usarla para fines distintos al
      reparto del negocio.
    </p>

    <h2>Disponibilidad</h2>
    <p>
      La aplicación necesita conexión a internet para guardar los registros. Procuramos que esté
      siempre disponible, pero puede haber interrupciones por fallas de la señal, del dispositivo o
      de los proveedores del servicio. Si no puedes registrar algo, anótalo y avisa al encargado.
    </p>

    <h2>Datos personales</h2>
    <p>
      El tratamiento de tus datos se explica en el
      <RouterLink :to="{ name: 'privacy' }">aviso de privacidad</RouterLink>.
    </p>

    <h2>Cambios y ley aplicable</h2>
    <p>
      Estos términos pueden cambiar; la versión vigente es la publicada en esta página. Se rigen por
      las leyes de México y, para cualquier controversia, por los tribunales competentes de
      {{ LEGAL.jurisdiction }}.
    </p>
  </LegalPage>
</template>
