import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Auth & Roles (e2e)', () => {
  let app: INestApplication;
  let cookie: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    const cookieParser = require('cookie-parser');
    app.use(cookieParser());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });


  it('POST /auth/login', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@test.com',
        password: '123456',
      })
      .expect(200);

    expect(res.headers['set-cookie']).toBeDefined();

    cookie = res.headers['set-cookie'][0];
  });

  it('GET /users/user', async () => {
    await request(app.getHttpServer())
      .get('/users/user')
      .set('Cookie', cookie)
      .expect(200)
      .expect((res) => {
        expect(res.body.message).toBeDefined();
      });
  });

  it('GET /users/admin', async () => {
    await request(app.getHttpServer())
      .get('/users/admin')
      .set('Cookie', cookie)
      .expect(200)
      .expect((res) => {
        expect(res.body.message).toContain('admin');
      });
  });

  it('GET /users/user', async () => {
    await request(app.getHttpServer())
      .get('/users/user')
      .expect(401);
  });


  it('GET /users/admin', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@test2.com',
        password: '1234567',
      })
      .expect(200);

    const userCookie = res.headers['set-cookie'][0];

    await request(app.getHttpServer())
      .get('/users/admin')
      .set('Cookie', userCookie)
      .expect(403);
  });
});