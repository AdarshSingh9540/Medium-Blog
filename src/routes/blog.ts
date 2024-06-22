import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { verify } from 'hono/jwt';
import { createBlogInput, updateBlogInput } from "@adarshsingh9540/medium-common-package";
export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string,
    JWT_SECRET: string,
  },
  Variables: {
    userId: string;
  }
}>();

blogRouter.use('/*', async (c, next) => {
  const authheader = c.req.header("authorization") || "";
  try {
    const user = await verify(authheader, c.env.JWT_SECRET);
if (user) {
  //@ts-ignore
  c.set("userId", user.id);
  await next();
} else {
  throw new Error("Unauthorized");
}

  } catch (error) {
    c.status(403);
    return c.json({ error: "unauthorized error" });
  }
});

blogRouter.post('/', async (c) => {
  const body = await c.req.json();
  const {success} =  createBlogInput.safeParse(body);
  if(!success){
    c.status(411);
    return c.json({
      message:"Input are not correct"
    })
  }
  const authorId = c.get('userId');
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

 
  const post = await prisma.post.create({
    data: {
      title: body.title,
      content: body.content,
      authorId: Number(authorId)
    }
  });
  return c.json({ id: post.id });
});

blogRouter.put('/:id', async (c) => {
  const body = await c.req.json();
  const {success} =  updateBlogInput.safeParse(body);
  if(!success){
    c.status(411);
    return c.json({
      message:"Input are not correct"
    })
  }
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());


  const post = await prisma.post.update({
    where: {
       id:body.id
      },
    data: {
      title: body.title,
      content: body.content,
    }
  });
  return c.json({ id: post.id });
});

blogRouter.get('/bulk', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());
  const blogs = await prisma.post.findMany();

  return c.json({ blogs });
});

blogRouter.get('/:id', async (c) => {
  const id =  c.req.param("id");
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());


  try {
    const post = await prisma.post.findFirst({
      where: { id: Number(id) }
    });
    return c.json({ post });
  } catch {
    c.status(411);
    return c.json({ message: "error while getting blog" });
  }
});
