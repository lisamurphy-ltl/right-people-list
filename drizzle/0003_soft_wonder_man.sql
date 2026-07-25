ALTER TABLE `subscriptions` ADD `bonusLeads` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `lastTopUpSessionId` varchar(128);