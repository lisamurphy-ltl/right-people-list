CREATE TABLE `deep_research_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`icpProfileId` int,
	`status` enum('pending','running','complete','failed') NOT NULL DEFAULT 'pending',
	`icaSnapshot` text,
	`results` text,
	`totalFound` int NOT NULL DEFAULT 0,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deep_research_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `icp_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT false,
	`industry` text,
	`roles` text,
	`businessSize` text,
	`geography` varchar(256),
	`activeSignals` text,
	`problemTheyreIn` text,
	`whatTheyLookLike` text,
	`queryState` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `icp_profiles_id` PRIMARY KEY(`id`)
);
