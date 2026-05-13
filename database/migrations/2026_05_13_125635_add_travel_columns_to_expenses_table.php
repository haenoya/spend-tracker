<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->string('payer')->default('나')->after('memo');
            $table->string('currency')->default('KRW')->after('payer');
            $table->unsignedInteger('amount_krw')->default(0)->after('currency');
        });
    }

    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropColumn(['payer', 'currency', 'amount_krw']);
        });
    }
};
