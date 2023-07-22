<template>
  <div>
    Pending: {{ resources.pending }}<br>
    Status: {{ resources.status }}<br>
    Data: {{ resources.data }}<br>
    Error: {{ resources.error }}
  </div>
</template>

<script setup lang="ts">
const resources = await useFetch<Array<unknown>>(
  'http://localhost:8080/v1/resource',
);
</script>
