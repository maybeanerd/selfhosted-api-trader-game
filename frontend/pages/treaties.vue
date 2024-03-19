<template>
  <div>
    <h1>Available Treaties:</h1>
    <ShowAllTreaties />
  </div>
</template>

<script setup lang="ts">
import { useHeader } from '~/composables/useHeader';

const { title } = useHeader();
title.value = 'Treaties';
</script>
