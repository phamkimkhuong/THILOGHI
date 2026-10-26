CREATE TABLE "users" (
	"user_id" varchar(50) PRIMARY KEY NOT NULL,
	"username" varchar(100) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"role" varchar(50) NOT NULL,
	"region_scopes" text[] NOT NULL,
	"email" varchar(255),
	"company" varchar(100),
	"department" varchar(100),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
