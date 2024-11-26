import { Request, Response, Router } from 'express'
import HttpStatus from 'http-status'
// express-async-errors is a module that handles async errors in express, don't forget import it in your new controllers
import 'express-async-errors'

import { db, BodyValidation } from '@utils'

import { StorageRepositoryImpl } from '../repository'
import { StorageService, StorageServiceImpl } from '../service'
import {PostService, PostServiceImpl} from "@domains/post/service";
import {PostRepositoryImpl} from "@domains/post/repository";

// Should I make an endpoint for this? I don't think so, it should be handled by the post controller

// AS FOR NOW, THIS IS OBSOLETE. There shouldnt be a storage controller.
