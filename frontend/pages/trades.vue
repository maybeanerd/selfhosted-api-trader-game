<template>
  <div>
    <h1>Propose a Trade:</h1>
    <br>
    <ProposeTrade />
    <br>
    <h1>Trades:</h1>
    <br>
    <ShowAllTrades />
  </div>
</template>

<script setup lang="ts">
import { useHeader } from '~/composables/useHeader';

const { title } = useHeader();
title.value = 'Trades';
</script>
