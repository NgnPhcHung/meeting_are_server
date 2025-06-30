-- CreateTable
CREATE TABLE "rooms" (
    "id" SERIAL NOT NULL,
    "hash" VARCHAR(255),
    "ownerId" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "participants" INTEGER[],

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
