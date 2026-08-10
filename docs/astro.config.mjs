// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'FitStudy Documentatie',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/withastro/starlight' }],
			sidebar: [
			{
				label: 'Introductie',
				slug: 'index',
			},
			{
				label: 'Gebruikershandleiding',
				items: [
				{ label: 'Inlogscherm', slug: 'gebruikershandleiding/inlogscherm' },
				{ label: 'Student Dashboard', slug: 'gebruikershandleiding/student-dashboard' },
				{ label: 'Docent Dashboard', slug: 'gebruikershandleiding/docent-dashboard' },
				{ label: 'Admin Dashboard', slug: 'gebruikershandleiding/admin-dashboard' },
				],
			},
			{
				label: 'Aanvullende informatie',
				items: [
				{ label: 'Controle en afsluiting', slug: 'aanvullende-informatie/controle-afsluiting' },
				{ label: 'Troubleshooting', slug: 'aanvullende-informatie/troubleshooting' },
				{ label: 'Bekende beperkingen', slug: 'aanvullende-informatie/bekende-beperkingen' },
				{ label: 'Versiebeheer', slug: 'aanvullende-informatie/versiebeheer' },
				{ label: 'Begrippenlijst', slug: 'aanvullende-informatie/begrippenlijst' },
				],
			},
			],
		}),
	],
});
