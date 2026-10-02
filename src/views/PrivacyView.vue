<script setup lang="ts">
import LegalPage from '@/components/LegalPage.vue'
import { LEGAL } from '@/legal'
</script>

<template>
  <LegalPage title="Aviso de privacidad">
    <p>
      <strong>{{ LEGAL.owner }}</strong
      >, con domicilio en {{ LEGAL.address }} (el «responsable»), trata los datos personales que se
      registran en la aplicación Reparto de Tortillas conforme a la Ley Federal de Protección de
      Datos Personales en Posesión de los Particulares y a este aviso.
    </p>

    <h2>Qué datos tratamos</h2>
    <p>La aplicación solo la usan los repartidores y encargados del negocio. De ellos tratamos:</p>
    <ul>
      <li>
        <strong>Datos de la cuenta:</strong> nombre completo, nombre de usuario, contraseña (se
        guarda cifrada; nadie puede leerla), rol y si la cuenta está activa.
      </li>
      <li>
        <strong>Registros del trabajo:</strong> fecha de cada ruta, kilos con que se sale, hora de
        salida y de cierre, y por cada parada el nombre de la tienda o cliente, el tipo (entrega o
        recolección), los kilos, el dinero cobrado, la hora del registro y las notas que se
        escriban.
      </li>
      <li>
        <strong>Datos técnicos:</strong> la sesión que se guarda en el dispositivo para no pedir la
        contraseña cada vez, y los registros técnicos (como la dirección IP y la hora de acceso) que
        generan los servicios donde se aloja la aplicación.
      </li>
    </ul>
    <p>
      No tratamos datos personales sensibles, no pedimos la ubicación del dispositivo y no usamos
      cookies de publicidad ni de rastreo.
    </p>
    <p>
      Las paradas se identifican con el nombre de la tienda o del cliente. Si ese nombre es el de
      una persona, también es un dato personal y se trata solo para las finalidades de este aviso.
      Te pedimos no escribir en las notas datos personales que no hagan falta.
    </p>

    <h2>Para qué los usamos</h2>
    <p>Los datos se usan únicamente para:</p>
    <ul>
      <li>Dar acceso a la aplicación y administrar las cuentas.</li>
      <li>
        Llevar el control diario de los kilos que salen a ruta, los que se entregan o se recogen y
        el dinero cobrado.
      </li>
      <li>Generar los reportes diarios del negocio.</li>
      <li>Mantener la seguridad de la aplicación y de la información.</li>
    </ul>
    <p>
      Estas finalidades son necesarias para la relación de trabajo con el negocio, por lo que no
      requieren un consentimiento aparte. No usamos los datos para publicidad, mercadotecnia ni
      ninguna otra finalidad.
    </p>

    <h2>Con quién se comparten</h2>
    <p>
      No vendemos ni transferimos los datos a terceros. Para que la aplicación funcione, los datos
      se almacenan con proveedores que actúan por cuenta del responsable y solo según sus
      instrucciones: <strong>Supabase</strong> (base de datos e inicio de sesión) y
      <strong>Netlify</strong> (publicación de la aplicación). Sus servidores pueden estar fuera de
      México.
    </p>
    <p>
      Solo compartiríamos datos con autoridades cuando una ley o una orden de autoridad competente
      lo exija.
    </p>

    <h2>Cuánto tiempo los conservamos</h2>
    <p>
      Los datos de la cuenta se conservan mientras la persona trabaje con el negocio. Los registros
      de rutas y paradas se conservan el tiempo necesario para el control del negocio y los plazos
      que exijan las leyes fiscales y laborales; después se eliminan.
    </p>

    <h2>Tus derechos (ARCO)</h2>
    <p>
      Puedes pedir el <strong>acceso</strong> a tus datos, su <strong>rectificación</strong> si
      están mal, su <strong>cancelación</strong> o <strong>oponerte</strong> a su uso, así como
      revocar tu consentimiento o limitar su uso, cuando la ley lo permita. Algunas solicitudes
      pueden no proceder mientras los datos sean necesarios para la relación de trabajo o por una
      obligación legal.
    </p>
    <p>
      Haz tu solicitud en persona con el encargado o con el dueño del negocio, en el domicilio del
      responsable. Puede ser de palabra o por escrito, e incluir:
    </p>
    <ul>
      <li>Tu nombre y un medio para responderte.</li>
      <li>Una identificación oficial (o la de tu representante y el documento que lo acredite).</li>
      <li>Qué derecho quieres ejercer y sobre qué datos.</li>
    </ul>
    <p>Te responderemos dentro de los plazos que marca la ley.</p>

    <h2>Cambios a este aviso</h2>
    <p>
      Si este aviso cambia, publicaremos la nueva versión en esta misma página, con su fecha de
      actualización.
    </p>
  </LegalPage>
</template>
