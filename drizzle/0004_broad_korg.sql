CREATE TABLE `scraped_leads_index` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fullName` varchar(256) NOT NULL,
	`title` varchar(256),
	`company` varchar(256),
	`linkedinUrl` varchar(512) NOT NULL,
	`industry` text,
	`location` varchar(256),
	`companySize` varchar(64),
	`searchQuery` text,
	`source` enum('serpapi','llm') NOT NULL DEFAULT 'serpapi',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scraped_leads_index_id` PRIMARY KEY(`id`),
	CONSTRAINT `scraped_leads_index_linkedinUrl_unique` UNIQUE(`linkedinUrl`)
);
