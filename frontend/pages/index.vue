<template>
  <h1>empty page for now</h1>
</template>

<script setup lang="ts">
import { useHeader } from '~/composables/useHeader';

const { title } = useHeader();
title.value = 'empty page';
</script>
