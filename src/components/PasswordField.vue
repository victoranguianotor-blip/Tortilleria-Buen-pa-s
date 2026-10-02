<script setup lang="ts">
import { ref } from 'vue'

import StrokeIcon from '@/components/StrokeIcon.vue'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{ visible?: boolean }>(), { visible: false })
const model = defineModel<string>({ required: true })
const show = ref(props.visible)
</script>

<template>
  <span class="relative block">
    <input
      v-model="model"
      v-bind="$attrs"
      class="field pr-16!"
      :type="show ? 'text' : 'password'"
      autocapitalize="none"
      autocorrect="off"
      spellcheck="false"
    />
    <button
      type="button"
      class="absolute inset-y-0 right-0 grid w-16 place-items-center text-2xl text-steel"
      :aria-label="show ? 'Ocultar contraseña' : 'Mostrar contraseña'"
      :aria-pressed="show"
      @click="show = !show"
    >
      <StrokeIcon :name="show ? 'eye-off' : 'eye'" />
    </button>
  </span>
</template>
