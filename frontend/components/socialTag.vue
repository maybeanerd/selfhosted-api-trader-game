<template>
  <NTag>
    {{ props.social.name }}
    <template #icon>
      <NIcon :component="getIconOfServiceType(props.social.type)" />
    </template>
  </NTag>
</template>

<script setup lang="ts">
import { NTag, NIcon } from 'naive-ui';
import {
  LogoLinkedin,
  LogoGithub,
  LogoMastodon,
  Mail,
} from '@vicons/ionicons5';
import { Profile, Social } from '~/server/profile.types';

const props = defineProps<{ social: Profile['person']['socials'][0] }>();

function getIconOfServiceType (type: Social) {
  switch (type) {
    case Social.linkedin:
      return LogoLinkedin;
    case Social.github:
      return LogoGithub;
    case Social.mastodon:
      return LogoMastodon;
    case Social.email:
      return Mail;
    default:
      return LogoLinkedin;
  }
}
</script>
