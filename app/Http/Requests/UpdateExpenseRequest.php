<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'date'     => 'required|date',
            'item'     => 'required|max:20',
            'amount'   => 'required|integer|min:1',
            'category' => 'required',
        ];
    }

    public function messages(): array
    {
        return [
            'date.required'     => '날짜를 입력해주세요.',
            'item.required'     => '항목명을 입력해주세요.',
            'item.max'          => '항목명은 20자 이하로 입력해주세요.',
            'amount.required'   => '금액을 입력해주세요.',
            'amount.min'        => '금액은 1원 이상이어야 합니다.',
            'category.required' => '카테고리를 선택해주세요.',
        ];
    }
}
