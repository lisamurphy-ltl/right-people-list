ALTER TABLE `leads` ADD `lastContactedAt` timestamp;--> statement-breakpoint
ALTER TABLE `leads` ADD `notAFit` boolean DEFAULT false NOT NULL;