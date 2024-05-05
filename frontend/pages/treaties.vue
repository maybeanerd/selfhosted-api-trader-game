<template>
  <div>
    <h1>Propose a Treaty:</h1>
    <br>
    <ProposeTreaty />
    <br>
    <h1>Available Treaties:</h1>
    <br>
    <ShowAllTreaties />
  </div>
</template>

<script setup lang="ts">
import { useHeader } from '~/composables/useHeader';

const { title } = useHeader();
title.value = 'Treaties';
</script>
