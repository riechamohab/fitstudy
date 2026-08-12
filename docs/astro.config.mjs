// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'FitStudy Gebruikershandleiding',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/withastro/starlight' }],
			sidebar: [
			{
				label: 'Introductie',
				slug: 'index',
			},
			{
				label: 'Dashboards en functies',
				items: [
				{ label: 'Inlogscherm', slug: 'dashboards-en-functies/inlogscherm' },
				{ label: 'Student Dashboard', slug: 'dashboards-en-functies/student-dashboard' },
				{ label: 'Docent Dashboard', slug: 'dashboards-en-functies/docent-dashboard' },
				{ label: 'Admin Dashboard', slug: 'dashboards-en-functies/admin-dashboard' },
				],
			},
			{
				label: 'Ondersteunende informatie',
				items: [
				{ label: 'Controle en afsluiting', slug: 'ondersteunende-informatie/controle-afsluiting' },
				{ label: 'Troubleshooting', slug: 'ondersteunende-informatie/troubleshooting' },
				{ label: 'Bekende beperkingen', slug: 'ondersteunende-informatie/bekende-beperkingen' },
				{ label: 'Versiebeheer', slug: 'ondersteunende-informatie/versiebeheer' },
				{ label: 'Begrippenlijst', slug: 'ondersteunende-informatie/begrippenlijst' },
				],
			},
			],
		}),
	],
});
