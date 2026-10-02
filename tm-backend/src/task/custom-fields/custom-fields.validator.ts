// custom-fields.validator.ts
import {
  ValidatorConstraint,           // Decorator để đánh dấu "đây là class validator"
  ValidatorConstraintInterface,  // Interface bắt buộc phải implement
  ValidationArguments,           // Chứa thông tin về field đang được validate
  registerDecorator,             // Hàm để tạo decorator từ class
  ValidationOptions,             // Kiểu options như { message: '...' }
} from 'class-validator';
import { AcademicSchema } from './schema/academic.schema.js';
import { OperationalSchema } from './schema/operational.schema.js';

// ① @ValidatorConstraint: NestJS/class-validator biết đây là "bộ não" của validator
//    name: tên dùng để debug
//    async: false vì ta không cần query DB trong validator này
@ValidatorConstraint({ name: 'isValidCustomFields', async: false })
export class IsValidCustomFieldsConstraint implements ValidatorConstraintInterface {

  // ② validate() là hàm BẮT BUỘC phải có
  //    value = giá trị của field customFields được truyền vào từ request body
  //    Trả về true = hợp lệ, false = lỗi
  validate(value: unknown, args: ValidationArguments): boolean {
    
    // Nếu không truyền customFields → cho qua (vì field này optional)
    if (value === undefined || value === null) return true;

    // Nếu không phải object (ví dụ truyền string "hello") → lỗi
    if (typeof value !== 'object' || Array.isArray(value)) return false;

    // Ép kiểu để TypeScript không phàn nàn
    const obj = value as Record<string, unknown>;
    
    // Đọc moduleType từ trong object
    const moduleType = obj['moduleType'];

    // Tùy moduleType, dùng schema tương ứng để validate
    if (moduleType === 'ACADEMIC') {
      // safeParse() = validate nhưng KHÔNG throw exception, trả về { success: true/false }
      const result = AcademicSchema.safeParse(value);
      return result.success;
    }

    if (moduleType === 'OPERATIONAL') {
      const result = OperationalSchema.safeParse(value);
      return result.success;
    }

    // GENERAL hoặc không có moduleType → cho qua
    if (moduleType === 'GENERAL' || moduleType === undefined) {
      return true;
    }

    // moduleType lạ, không có trong danh sách → lỗi
    return false;
  }

  // ③ defaultMessage() = thông báo lỗi khi validate() trả về false
  defaultMessage(args: ValidationArguments): string {
    return 'customFields is invalid. Check moduleType and fields inside.';
  }
}

// ④ Đây là hàm decorator thật sự mà bạn dùng trong DTO (@IsValidCustomFields())
//    Nó chỉ là wrapper gọi registerDecorator() với class ở trên
export function IsValidCustomFields(validationOptions?: ValidationOptions) {
  // Trả về 1 function nhận 2 tham số (đây là pattern của TypeScript decorator)
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,   // Class chứa field này (ví dụ: CreateTaskDto)
      propertyName: propertyName,   // Tên field (ví dụ: "customFields")
      options: validationOptions,   // Options như { message: '...' } nếu muốn ghi đè
      constraints: [],              // Không có constraints bổ sung
      validator: IsValidCustomFieldsConstraint, // Kết nối với class "não" ở trên
    });
  };
}
