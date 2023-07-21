<template>
  <div>
    <NH1>First request:</NH1>
    <div>
      Pending: {{ resources.pending }}<br>
      Status: {{ resources.status }}<br>
      Data: {{ resources.data }}<br>
      Error: {{ resources.error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { NH1 } from 'naive-ui';
import { useHeader } from '~/composables/useHeader';

const { title } = useHeader();
title.value = 'empty page';

const resources = await useFetch<Array<unknown>>(
  'http://localhost:8080/v1/resource',
);
</script>
