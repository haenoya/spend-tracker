<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trips', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80);
            $table->string('token_hash', 64)->unique();
            $table->boolean('is_legacy')->default(false);
            $table->timestamps();
        });
        Schema::create('participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trip_id')->constrained()->cascadeOnDelete();
            $table->string('name', 30);
            $table->unique(['trip_id', 'name']);
        });
        Schema::table('expenses', function (Blueprint $table) {
            $table->foreignId('trip_id')->nullable()->constrained();
            $table->foreignId('payer_id')->nullable()->constrained('participants');
            $table->unsignedInteger('version')->default(1);
        });
        Schema::create('expense_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trip_id')->constrained()->cascadeOnDelete();
            $table->foreignId('actor_id')->constrained('participants');
            $table->unsignedBigInteger('expense_id');
            $table->string('action', 10);
            $table->text('before')->nullable();
            $table->text('after')->nullable();
            $table->timestamp('created_at');
            $table->index(['trip_id', 'id']);
        });

        // Keep original amounts. Only an explicit operator command issues a link.
        if (DB::table('expenses')->exists()) {
            DB::transaction(function () {
                $trip = DB::table('trips')->insertGetId([
                    'name' => '기존 여행 기록',
                    'token_hash' => hash('sha256', bin2hex(random_bytes(32))),
                    'is_legacy' => true,
                    'created_at' => now(), 'updated_at' => now(),
                ]);
                $names = DB::table('expenses')->distinct()->pluck('payer')->merge(['나', '동생'])->unique();
                foreach ($names as $name) {
                    $id = DB::table('participants')->insertGetId(['trip_id' => $trip, 'name' => $name]);
                    DB::table('expenses')->where('payer', $name)->update(['trip_id' => $trip, 'payer_id' => $id]);
                }
            });
        }
    }

    public function down(): void
    {
        // A downgrade cannot represent multi-person trips safely.
        throw new RuntimeException('다인 여행 데이터를 보호하기 위해 자동 롤백을 지원하지 않습니다. 배포 전 DB 백업을 복원하세요.');
    }
};
