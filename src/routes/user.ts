import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { jwt, sign , verify } from 'hono/jwt'
import { use } from 'hono/jsx'
import {  signinInput, signupInput } from '@adarshsingh9540/medium-common-package'
export const userRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string,
    JWT_SECRET: string
  }
}>()
userRouter.post('/signup', async (c) => {
  const body = await c.req.json();
  const {success} = signupInput.safeParse(body);
  if(!success){
    c.status(411);
    return c.json({
      message:"Input are not correct"
    })
  }
    const prisma = new PrismaClient({
      //@ts-ignore
      datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate())
  
    try {
      const user = await prisma.user.create({
        data: {
          email: body.email,
          password: body.password
        }
      })
  
      //@ts-ignore
      const token = await sign({ id: user.id }, c.env.JWT_SECRET)
      
      return c.text(token)


    } catch (e) {
      console.error('Error creating user:', e)
      return c.json({ error: 'Internal Server Error' }, 500)
    }
  })
  
  userRouter.post('/signin',async (c) => {
    const body = await c.req.json();
    const {success} = signinInput.safeParse(body);
    if(!success){
      c.status(411);
      return c.json({
        message:"input not correct"
      })
    }
    const prisma = new PrismaClient({
      //@ts-ignore
      datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate())
  

    const user = await prisma.user.findFirst({
      where:{
        email:body.email,
        password:body.password,
      }
    });
    if (!user) {
          c.status(403);
          return c.json({ error: "user not found" });
      }
  
      const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
      return c.json({ jwt });
  })