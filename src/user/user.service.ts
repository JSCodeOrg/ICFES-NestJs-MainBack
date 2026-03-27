import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../auth/schemas/user.schema';
import { CreateUserDto } from './dto/createUserDto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User.name)
        private readonly userModel: Model<User>
    ) { }

    async register(userData: CreateUserDto) {
        const exists = await this.userModel.findOne({ email: userData.email });

        if (exists) {
            throw new ConflictException('Este email ya se encuentra registrado.');
        }

        //Encriptación de la contraseña

 const hashedPassword = await bcrypt.hash(userData.password, 10);

const user = new this.userModel({
    email: userData.email,
    password: hashedPassword, // 
    firstname: userData.firstname,
    lastname: userData.lastname
});

        try {
            await user.save()
        } catch (error) {
            throw new InternalServerErrorException('Ocurrió un error al registrar el usuario.')
        }

        return {
            message: "Usuario registrado correctamente."
        }
    }
}
